import type { RowDataPacket } from "mysql2";
import { pool } from "../../../config/db";

export const reportRepository = {
  async activeSubscriptions(): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT s.*, c.customer_name, rp.plan_name
       FROM subscriptions s
       LEFT JOIN customers c ON c.customer_id = s.customer_id
       LEFT JOIN recurring_plans rp ON rp.plan_id = s.plan_id
       WHERE s.status = 'ACTIVE'
       ORDER BY s.subscription_id DESC`
    );
    return rows;
  },

  async revenueByMonth(months: number): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(payment_date, '%Y-%m') AS period, COALESCE(SUM(amount), 0) AS total
       FROM payments
       WHERE payment_status = 'SUCCESS'
         AND payment_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
       GROUP BY period
       ORDER BY period`,
      [months]
    );
    return rows;
  },

  async paymentsReport(): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.*, i.invoice_number, c.customer_name
       FROM payments p
       LEFT JOIN invoices i ON i.invoice_id = p.invoice_id
       LEFT JOIN customers c ON c.customer_id = p.customer_id
       ORDER BY p.payment_id DESC
       LIMIT 500`
    );
    return rows;
  },

  async overdueInvoices(): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT i.*, c.customer_name
       FROM invoices i
       INNER JOIN customers c ON c.customer_id = i.customer_id
       WHERE i.status IN ('DRAFT', 'CONFIRMED')
         AND i.due_date IS NOT NULL AND i.due_date < CURDATE()
       ORDER BY i.due_date ASC`
    );
    return rows;
  }
};
