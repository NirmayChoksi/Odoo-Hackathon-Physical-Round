import type { RowDataPacket } from "mysql2";
import { pool } from "../../../config/db";

export const dashboardRepository = {
  async countActiveSubscriptions(): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM subscriptions WHERE status = 'ACTIVE'`
    );
    return Number(rows[0]?.c ?? 0);
  },

  async sumSuccessfulPayments(): Promise<string> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(amount), 0) AS s FROM payments WHERE payment_status = 'SUCCESS'`
    );
    return String(rows[0]?.s ?? 0);
  },

  async countOverdueInvoices(): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM invoices
       WHERE status IN ('DRAFT', 'CONFIRMED')
         AND due_date IS NOT NULL AND due_date < CURDATE()`
    );
    return Number(rows[0]?.c ?? 0);
  },

  async recentPayments(limit: number): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.*, i.invoice_number
       FROM payments p
       LEFT JOIN invoices i ON i.invoice_id = p.invoice_id
       ORDER BY p.payment_id DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  },

  async revenueByMonth(months: number): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(payment_date, '%Y-%m') AS ym, COALESCE(SUM(amount), 0) AS total
       FROM payments
       WHERE payment_status = 'SUCCESS'
         AND payment_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
       GROUP BY ym
       ORDER BY ym`,
      [months]
    );
    return rows;
  },

  async subscriptionsByStatus(): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT status, COUNT(*) AS c FROM subscriptions GROUP BY status`
    );
    return rows;
  },

  async paymentsByStatus(): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT payment_status, COUNT(*) AS c FROM payments GROUP BY payment_status`
    );
    return rows;
  }
};
