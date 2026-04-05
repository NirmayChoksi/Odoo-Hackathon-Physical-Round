import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../../config/db";

export const invoiceRepository = {
  async getInvoiceForUser(invoiceNumber: string, userId: number): Promise<RowDataPacket | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT i.*, s.subscription_number, s.status AS subscription_status
       FROM invoices i
       INNER JOIN subscriptions s ON s.subscription_id = i.subscription_id
       INNER JOIN customers c ON c.customer_id = i.customer_id AND c.portal_user_id = ?
       WHERE i.invoice_number = ?
       LIMIT 1`,
      [userId, invoiceNumber]
    );
    return rows[0] ?? null;
  },

  async getInvoiceItems(invoiceId: number): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ii.*, p.product_name
       FROM invoice_items ii
       INNER JOIN products p ON p.product_id = ii.product_id
       WHERE ii.invoice_id = ?
       ORDER BY ii.invoice_item_id`,
      [invoiceId]
    );
    return rows;
  },

  async getLatestPayment(invoiceId: number): Promise<RowDataPacket | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_id DESC LIMIT 1`,
      [invoiceId]
    );
    return rows[0] ?? null;
  },

  async recordPayment(
    invoiceId: number,
    customerId: number,
    paymentMethod: string,
    amount: number
  ): Promise<number> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
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
      return payIns.insertId;
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }
};
