import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../../config/db";
import type { OrderListQuery } from "./order.types";

export const orderRepository = {
  async listOrdersForUser(userId: number, q: OrderListQuery): Promise<{ rows: RowDataPacket[]; total: number }> {
    const offset = (q.page - 1) * q.limit;
    const base: unknown[] = [userId];
    const statusClause = q.status ? " AND s.status = ?" : "";
    if (q.status) base.push(q.status);

    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM subscriptions s
       INNER JOIN customers c ON c.customer_id = s.customer_id AND c.portal_user_id = ?
       WHERE 1=1 ${statusClause}`,
      base
    );
    const total = Number(countRows[0]?.c ?? 0);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT s.*, c.customer_name, rp.plan_name, rp.billing_period, rp.price AS plan_price
       FROM subscriptions s
       INNER JOIN customers c ON c.customer_id = s.customer_id AND c.portal_user_id = ?
       LEFT JOIN recurring_plans rp ON rp.plan_id = s.plan_id
       WHERE 1=1 ${statusClause}
       ORDER BY s.subscription_id DESC
       LIMIT ? OFFSET ?`,
      [...base, q.limit, offset]
    );
    return { rows, total };
  },

  async getOrderForUser(orderNumber: string, userId: number): Promise<RowDataPacket | null> {
    const [subs] = await pool.query<RowDataPacket[]>(
      `SELECT s.*, c.customer_name, c.email AS customer_email, c.portal_user_id,
              rp.plan_name, rp.billing_period, rp.price AS plan_price
       FROM subscriptions s
       INNER JOIN customers c ON c.customer_id = s.customer_id
       LEFT JOIN recurring_plans rp ON rp.plan_id = s.plan_id
       WHERE s.subscription_number = ? AND c.portal_user_id = ?
       LIMIT 1`,
      [orderNumber, userId]
    );
    return subs[0] ?? null;
  },

  async getSubscriptionItems(subscriptionId: number): Promise<RowDataPacket[]> {
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

  async getInvoiceBySubscription(subscriptionId: number): Promise<RowDataPacket | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM invoices WHERE subscription_id = ? ORDER BY invoice_id DESC LIMIT 1`,
      [subscriptionId]
    );
    return rows[0] ?? null;
  },

  async listInvoicesBySubscription(subscriptionId: number): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM invoices WHERE subscription_id = ? ORDER BY invoice_id DESC`,
      [subscriptionId]
    );
    return rows;
  },

  async getPaymentByInvoice(invoiceId: number): Promise<RowDataPacket | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_id DESC LIMIT 1`,
      [invoiceId]
    );
    return rows[0] ?? null;
  },

  async closeSubscription(orderNumber: string, userId: number): Promise<boolean> {
    const [res] = await pool.query<ResultSetHeader>(
      `UPDATE subscriptions s
       INNER JOIN customers c ON c.customer_id = s.customer_id AND c.portal_user_id = ?
       SET s.status = 'CLOSED', s.updated_at = CURRENT_TIMESTAMP
       WHERE s.subscription_number = ?`,
      [userId, orderNumber]
    );
    return res.affectedRows > 0;
  },

  async renewSubscription(orderNumber: string, userId: number): Promise<{ orderNumber: string; subscriptionId: number }> {
    const sub = await this.getOrderForUser(orderNumber, userId);
    if (!sub) throw new Error("NOT_FOUND");
    if (sub.status === "CLOSED") throw new Error("CLOSED");

    const oldId = sub.subscription_id as number;
    const items = await this.getSubscriptionItems(oldId);
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const customerId = sub.customer_id as number;
      const planId = sub.plan_id as number;
      const [ins] = await conn.query<ResultSetHeader>(
        `INSERT INTO subscriptions (
          customer_id, plan_id, template_id, start_date, status,
          subtotal, discount_amount, tax_amount, total_amount, created_by
        ) VALUES (?, ?, NULL, CURDATE(), 'ACTIVE', ?, ?, ?, ?, NULL)`,
        [
          customerId,
          planId,
          sub.subtotal,
          sub.discount_amount,
          sub.tax_amount,
          sub.total_amount
        ]
      );
      const newSubId = ins.insertId;
      for (const row of items) {
        await conn.query(
          `INSERT INTO subscription_items (
            subscription_id, product_id, variant_id, quantity, unit_price, tax_id, discount_id, amount
          ) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?)`,
          [newSubId, row.product_id, row.variant_id, row.quantity, row.unit_price, row.amount]
        );
      }
      const [numRows] = await conn.query<RowDataPacket[]>(
        `SELECT subscription_number FROM subscriptions WHERE subscription_id = ? LIMIT 1`,
        [newSubId]
      );
      const newOrder = String(numRows[0]?.subscription_number ?? `SUB-${newSubId}`);
      await conn.commit();
      return { orderNumber: newOrder, subscriptionId: newSubId };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  },

  async payLatestInvoice(
    orderNumber: string,
    userId: number,
    paymentMethod: string
  ): Promise<{ paymentId: number; invoiceId: number }> {
    const sub = await this.getOrderForUser(orderNumber, userId);
    if (!sub) throw new Error("NOT_FOUND");
    const subId = sub.subscription_id as number;
    const inv = await this.getInvoiceBySubscription(subId);
    if (!inv) throw new Error("NO_INVOICE");
    if (inv.status === "PAID") throw new Error("ALREADY_PAID");

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const invoiceId = inv.invoice_id as number;
      const customerId = sub.customer_id as number;
      const amount = Number(inv.total_amount);
      const [payIns] = await conn.query<ResultSetHeader>(
        `INSERT INTO payments (
          invoice_id, customer_id, payment_method, amount, payment_date, payment_status, transaction_reference, notes
        ) VALUES (?, ?, ?, ?, CURDATE(), 'SUCCESS', NULL, NULL)`,
        [invoiceId, customerId, paymentMethod, amount]
      );
      await conn.query(`UPDATE invoices SET status = 'PAID', updated_at = CURRENT_TIMESTAMP WHERE invoice_id = ?`, [
        invoiceId
      ]);
      await conn.commit();
      return { paymentId: payIns.insertId, invoiceId };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }
};
