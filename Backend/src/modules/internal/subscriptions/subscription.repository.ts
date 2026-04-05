import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../../config/db";
import { offset } from "../../../utils/pagination";
import type {
  CreateSubscriptionBody,
  CreateSubscriptionItemBody,
  PatchSubscriptionBody,
  PatchSubscriptionItemBody,
  SubscriptionListQuery
} from "./subscription.types";

async function recalcTotals(conn: { query: typeof pool.query }, subscriptionId: number): Promise<void> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT COALESCE(SUM(amount), 0) AS s FROM subscription_items WHERE subscription_id = ?`,
    [subscriptionId]
  );
  const subtotal = Number(rows[0]?.s ?? 0);
  await conn.query(
    `UPDATE subscriptions SET subtotal = ?, discount_amount = 0, tax_amount = 0, total_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE subscription_id = ?`,
    [subtotal, subtotal, subscriptionId]
  );
}

export const subscriptionRepository = {
  /** Returns the next subscription number (based on AUTO_INCREMENT) formatted as "SO-XXXX". */
  async getNextNumber(): Promise<string> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT AUTO_INCREMENT AS next_id
       FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'subscriptions'`
    );
    const nextId = Number(rows[0]?.next_id ?? 1);
    return `SO-${String(nextId).padStart(4, '0')}`;
  },

  async list(q: SubscriptionListQuery): Promise<{ rows: RowDataPacket[]; total: number }> {
    const off = offset(q.page, q.limit);
    const where: string[] = ["1=1"];
    const params: unknown[] = [];
    if (q.status) {
      where.push(`s.status = ?`);
      params.push(q.status);
    }
    if (q.customerId) {
      where.push(`s.customer_id = ?`);
      params.push(q.customerId);
    }
    if (q.search) {
      where.push(`(s.subscription_number LIKE ? OR c.customer_name LIKE ?)`);
      const s = `%${q.search}%`;
      params.push(s, s);
    }
    const w = where.join(" AND ");
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c 
       FROM subscriptions s 
       LEFT JOIN customers c ON c.customer_id = s.customer_id
       WHERE ${w}`,
      params
    );
    const total = Number(countRows[0]?.c ?? 0);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT s.*, c.customer_name
       FROM subscriptions s
       LEFT JOIN customers c ON c.customer_id = s.customer_id
       WHERE ${w}
       ORDER BY s.subscription_id DESC
       LIMIT ? OFFSET ?`,
      [...params, q.limit, off]
    );
    return { rows, total };
  },

  async getById(subscriptionId: number): Promise<RowDataPacket | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT s.*, c.customer_name
       FROM subscriptions s
       LEFT JOIN customers c ON c.customer_id = s.customer_id
       WHERE s.subscription_id = ? LIMIT 1`,
      [subscriptionId]
    );
    return rows[0] ?? null;
  },

  async insert(body: CreateSubscriptionBody, createdBy: number | null): Promise<number> {
    const status = body.status && ["DRAFT", "QUOTATION", "CONFIRMED", "ACTIVE", "CLOSED"].includes(body.status)
      ? body.status
      : "DRAFT";
    const start = body.startDate || new Date().toISOString().slice(0, 10);
    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO subscriptions (
        customer_id, plan_id, template_id, start_date, status,
        subtotal, discount_amount, tax_amount, total_amount, created_by
      ) VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, ?)`,
      [body.customerId, body.planId, body.templateId ?? null, start, status, createdBy]
    );
    return res.insertId;
  },

  async update(subscriptionId: number, body: PatchSubscriptionBody): Promise<boolean> {
    const sets: string[] = [];
    const vals: unknown[] = [];
    if (body.planId !== undefined) {
      sets.push("plan_id = ?");
      vals.push(body.planId);
    }
    if (body.templateId !== undefined) {
      sets.push("template_id = ?");
      vals.push(body.templateId);
    }
    if (body.expirationDate !== undefined) {
      sets.push("expiration_date = ?");
      vals.push(body.expirationDate);
    }
    if (body.paymentTerms !== undefined) {
      sets.push("payment_terms = ?");
      vals.push(body.paymentTerms);
    }
    if (!sets.length) return false;
    vals.push(subscriptionId);
    const [r] = await pool.query<ResultSetHeader>(
      `UPDATE subscriptions SET ${sets.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE subscription_id = ?`,
      vals
    );
    return r.affectedRows > 0;
  },

  async updateStatus(subscriptionId: number, status: string): Promise<boolean> {
    const [r] = await pool.query<ResultSetHeader>(
      `UPDATE subscriptions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE subscription_id = ?`,
      [status, subscriptionId]
    );
    return r.affectedRows > 0;
  },

  async close(subscriptionId: number): Promise<boolean> {
    return this.updateStatus(subscriptionId, "CLOSED");
  },

  async renew(subscriptionId: number): Promise<{ subscriptionId: number; subscriptionNumber: string }> {
    const sub = await this.getById(subscriptionId);
    if (!sub) throw new Error("NOT_FOUND");
    if (sub.status === "CLOSED") throw new Error("CLOSED");
    const [items] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM subscription_items WHERE subscription_id = ?`,
      [subscriptionId]
    );
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [ins] = await conn.query<ResultSetHeader>(
        `INSERT INTO subscriptions (
          customer_id, plan_id, template_id, start_date, status,
          subtotal, discount_amount, tax_amount, total_amount, created_by
        ) VALUES (?, ?, NULL, CURDATE(), 'ACTIVE', ?, ?, ?, ?, NULL)`,
        [
          sub.customer_id,
          sub.plan_id,
          sub.subtotal,
          sub.discount_amount,
          sub.tax_amount,
          sub.total_amount
        ]
      );
      const newId = ins.insertId;
      for (const row of items) {
        await conn.query(
          `INSERT INTO subscription_items (
            subscription_id, product_id, variant_id, quantity, unit_price, tax_id, discount_id, amount
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId,
            row.product_id,
            row.variant_id,
            row.quantity,
            row.unit_price,
            row.tax_id,
            row.discount_id,
            row.amount
          ]
        );
      }
      const [numRows] = await conn.query<RowDataPacket[]>(
        `SELECT subscription_number FROM subscriptions WHERE subscription_id = ? LIMIT 1`,
        [newId]
      );
      await conn.commit();
      return {
        subscriptionId: newId,
        subscriptionNumber: String(numRows[0]?.subscription_number ?? `SUB-${newId}`)
      };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  },

  async listItems(subscriptionId: number): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT si.*, p.product_name
       FROM subscription_items si
       INNER JOIN products p ON p.product_id = si.product_id
       WHERE si.subscription_id = ?
       ORDER BY si.subscription_item_id`,
      [subscriptionId]
    );
    return rows;
  },

  async getItem(subscriptionItemId: number): Promise<RowDataPacket | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM subscription_items WHERE subscription_item_id = ? LIMIT 1`,
      [subscriptionItemId]
    );
    return rows[0] ?? null;
  },

  async insertItem(subscriptionId: number, body: CreateSubscriptionItemBody): Promise<number> {
    const amount = body.quantity * body.unitPrice;
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [res] = await conn.query<ResultSetHeader>(
        `INSERT INTO subscription_items (
          subscription_id, product_id, variant_id, quantity, unit_price, tax_id, discount_id, amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          subscriptionId,
          body.productId,
          body.variantId ?? null,
          body.quantity,
          body.unitPrice,
          body.taxId ?? null,
          body.discountId ?? null,
          amount
        ]
      );
      await recalcTotals(conn, subscriptionId);
      await conn.commit();
      return res.insertId;
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  },

  async updateItem(subscriptionItemId: number, body: PatchSubscriptionItemBody): Promise<boolean> {
    const existing = await this.getItem(subscriptionItemId);
    if (!existing) return false;
    const subId = existing.subscription_id as number;
    const qty = body.quantity ?? Number(existing.quantity);
    const unit = body.unitPrice ?? Number(existing.unit_price);
    const amount = qty * unit;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const sets: string[] = [];
      const vals: unknown[] = [];
      if (body.productId !== undefined) {
        sets.push("product_id = ?");
        vals.push(body.productId);
      }
      if (body.variantId !== undefined) {
        sets.push("variant_id = ?");
        vals.push(body.variantId);
      }
      if (body.quantity !== undefined) {
        sets.push("quantity = ?");
        vals.push(body.quantity);
      }
      if (body.unitPrice !== undefined) {
        sets.push("unit_price = ?");
        vals.push(body.unitPrice);
      }
      if (body.taxId !== undefined) {
        sets.push("tax_id = ?");
        vals.push(body.taxId);
      }
      if (body.discountId !== undefined) {
        sets.push("discount_id = ?");
        vals.push(body.discountId);
      }
      sets.push("amount = ?");
      vals.push(amount);
      vals.push(subscriptionItemId);
      const [r] = await conn.query<ResultSetHeader>(
        `UPDATE subscription_items SET ${sets.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE subscription_item_id = ?`,
        vals
      );
      await recalcTotals(conn, subId);
      await conn.commit();
      return r.affectedRows > 0;
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  },

  async deleteItem(subscriptionItemId: number): Promise<boolean> {
    const existing = await this.getItem(subscriptionItemId);
    if (!existing) return false;
    const subId = existing.subscription_id as number;
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [r] = await conn.query<ResultSetHeader>(
        `DELETE FROM subscription_items WHERE subscription_item_id = ?`,
        [subscriptionItemId]
      );
      await recalcTotals(conn, subId);
      await conn.commit();
      return r.affectedRows > 0;
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  },

  async generateInvoiceFromSubscription(subscriptionId: number): Promise<{ invoiceId: number; invoiceNumber: string }> {
    const sub = await this.getById(subscriptionId);
    if (!sub) throw new Error("NOT_FOUND");
    const items = await this.listItems(subscriptionId);
    if (items.length === 0) throw new Error("NO_ITEMS");
    const customerId = sub.customer_id as number;
    const subtotal = Number(sub.subtotal);
    const tax = Number(sub.tax_amount);
    const disc = Number(sub.discount_amount);
    const total = Number(sub.total_amount);
    const invoiceNumber = `INV-${subscriptionId}-${Date.now()}`;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [invIns] = await conn.query<ResultSetHeader>(
        `INSERT INTO invoices (
          invoice_number, subscription_id, customer_id, invoice_date, due_date, status,
          subtotal, tax_amount, discount_amount, total_amount, notes
        ) VALUES (?, ?, ?, CURDATE(), NULL, 'DRAFT', ?, ?, ?, ?, NULL)`,
        [invoiceNumber, subscriptionId, customerId, subtotal, tax, disc, total]
      );
      const invoiceId = invIns.insertId;
      for (const row of items) {
        await conn.query(
          `INSERT INTO invoice_items (
            invoice_id, product_id, description, quantity, unit_price, tax_id, discount_id, line_total
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            invoiceId,
            row.product_id,
            row.product_name,
            row.quantity,
            row.unit_price,
            row.tax_id,
            row.discount_id,
            row.amount
          ]
        );
      }
      await conn.commit();
      return { invoiceId, invoiceNumber };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }
};
