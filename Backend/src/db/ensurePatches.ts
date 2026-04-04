import fs from "fs";
import path from "path";
import type { RowDataPacket } from "mysql2";
import { pool } from "../config/db";

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
