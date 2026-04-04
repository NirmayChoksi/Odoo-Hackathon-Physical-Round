import fs from "fs";
import path from "path";
import type { RowDataPacket } from "mysql2";
import type { Pool } from "mysql2/promise";
import { pool } from "../config/db";

/** mysql2 Pool or Connection — both implement .query for index DDL */
export type DbQueryable = Pick<Pool, "query">;

async function tableExists(tableName: string): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1 AS o FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = ? LIMIT 1`,
    [tableName]
  );
  return rows.length > 0;
}

async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1 AS o FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ? LIMIT 1`,
    [tableName, columnName]
  );
  return rows.length > 0;
}

async function constraintExists(tableName: string, constraintName: string): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1 AS o FROM information_schema.table_constraints
     WHERE table_schema = DATABASE() AND table_name = ? AND constraint_name = ? LIMIT 1`,
    [tableName, constraintName]
  );
  return rows.length > 0;
}

/** Legacy DBs: add products columns the app expects (idempotent). */
async function ensureProductsLegacyColumns(): Promise<void> {
  if (!(await tableExists("products"))) return;
  const steps: Array<[string, string]> = [
    ["image_url", "ALTER TABLE products ADD COLUMN image_url VARCHAR(500) NULL"],
    ["short_description", "ALTER TABLE products ADD COLUMN short_description VARCHAR(255) NULL"],
    ["terms_and_conditions", "ALTER TABLE products ADD COLUMN terms_and_conditions TEXT NULL"],
    ["is_recurring", "ALTER TABLE products ADD COLUMN is_recurring BOOLEAN DEFAULT TRUE"],
    ["created_by", "ALTER TABLE products ADD COLUMN created_by INT NULL"]
  ];
  for (const [col, ddl] of steps) {
    if (!(await columnExists("products", col))) {
      await pool.query(ddl);
    }
  }
  if (
    (await columnExists("products", "created_by")) &&
    (await tableExists("users")) &&
    !(await constraintExists("products", "fk_products_created_by"))
  ) {
    await pool.query(
      `ALTER TABLE products ADD CONSTRAINT fk_products_created_by FOREIGN KEY (created_by) REFERENCES users(user_id)`
    );
  }
}

/**
 * Keep in sync with `sql/patches/001_product_plans.sql` and `subscription_management.sql`.
 * Inlined so `node dist/index.js` works without shipping the `sql/` folder.
 */
const PRODUCT_PLANS_DDL = `
CREATE TABLE IF NOT EXISTS product_plans (
  product_plan_id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  plan_id INT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_plans_product FOREIGN KEY (product_id) REFERENCES products(product_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_product_plans_plan FOREIGN KEY (plan_id) REFERENCES recurring_plans(plan_id)
    ON DELETE CASCADE,
  CONSTRAINT uq_product_plan UNIQUE (product_id, plan_id)
);
`;

function projectRootFromHere(): string {
  return path.join(__dirname, "..", "..");
}

async function indexExistsOn(db: DbQueryable, tableName: string, indexName: string): Promise<boolean> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT 1 AS o FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ? LIMIT 1`,
    [tableName, indexName]
  );
  return rows.length > 0;
}

async function tableExistsOn(db: DbQueryable, tableName: string): Promise<boolean> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT 1 AS o FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = ? LIMIT 1`,
    [tableName]
  );
  return rows.length > 0;
}

/**
 * Composite and lookup indexes aligned with internal/external repositories (JOINs, filters, ORDER BY).
 * InnoDB already indexes FK child columns; these add multi-column paths and nullable lookup columns.
 * Safe to call on every server start.
 */
export async function ensurePerformanceIndexes(db: DbQueryable = pool): Promise<void> {
  const specs: Array<{ table: string; name: string; sql: string }> = [
    {
      table: "carts",
      name: "idx_carts_user_status_updated",
      sql: "CREATE INDEX idx_carts_user_status_updated ON carts (user_id, status, updated_at)"
    },
    {
      table: "cart_items",
      name: "idx_cart_items_cart_product_plan",
      sql: "CREATE INDEX idx_cart_items_cart_product_plan ON cart_items (cart_id, product_id, plan_id)"
    },
    {
      table: "subscriptions",
      name: "idx_subscriptions_status_subscription",
      sql: "CREATE INDEX idx_subscriptions_status_subscription ON subscriptions (status, subscription_id)"
    },
    {
      table: "invoices",
      name: "idx_invoices_status_due",
      sql: "CREATE INDEX idx_invoices_status_due ON invoices (status, due_date)"
    },
    {
      table: "payments",
      name: "idx_payments_status_paydate",
      sql: "CREATE INDEX idx_payments_status_paydate ON payments (payment_status, payment_date)"
    },
    {
      table: "products",
      name: "idx_products_status_created",
      sql: "CREATE INDEX idx_products_status_created ON products (status, created_at)"
    },
    {
      table: "customers",
      name: "idx_customers_email",
      sql: "CREATE INDEX idx_customers_email ON customers (email)"
    },
    {
      table: "audit_logs",
      name: "idx_audit_logs_created_at",
      sql: "CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at)"
    },
    {
      table: "audit_logs",
      name: "idx_audit_logs_user_created",
      sql: "CREATE INDEX idx_audit_logs_user_created ON audit_logs (user_id, created_at)"
    }
  ];

  for (const { table, name, sql } of specs) {
    if (!(await tableExistsOn(db, table))) continue;
    if (await indexExistsOn(db, table, name)) continue;
    await db.query(sql);
  }
}

/** Apply idempotent SQL patches. Safe to call on every server start. */
export async function ensureDbPatches(): Promise<void> {
  const preSchemaDir = path.join(projectRootFromHere(), "sql", "pre-schema");
  if (fs.existsSync(preSchemaDir)) {
    const preFiles = fs
      .readdirSync(preSchemaDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (const name of preFiles) {
      await pool.query(fs.readFileSync(path.join(preSchemaDir, name), "utf8"));
    }
  }

  await ensureProductsLegacyColumns();

  await pool.query(PRODUCT_PLANS_DDL);

  await ensurePerformanceIndexes();

  const patchesDir = path.join(projectRootFromHere(), "sql", "patches");
  if (!fs.existsSync(patchesDir)) {
    return;
  }
  const names = fs
    .readdirSync(patchesDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const name of names) {
    if (name === "001_product_plans.sql") {
      continue;
    }
    const full = path.join(patchesDir, name);
    await pool.query(fs.readFileSync(full, "utf8"));
  }
}
