import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../../config/db";
import { offset } from "../../../utils/pagination";
import type { PaymentListQuery } from "./payment.types";

export const paymentRepository = {
  async list(q: PaymentListQuery): Promise<{ rows: RowDataPacket[]; total: number }> {
    const off = offset(q.page, q.limit);
    const where: string[] = ["1=1"];
    const params: unknown[] = [];
    if (q.invoiceId) {
      where.push(`p.invoice_id = ?`);
      params.push(q.invoiceId);
    }
    if (q.status) {
      where.push(`p.payment_status = ?`);
      params.push(q.status);
    }
    const w = where.join(" AND ");
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM payments p WHERE ${w}`,
      params
    );
    const total = Number(countRows[0]?.c ?? 0);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.*, i.invoice_number
       FROM payments p
       LEFT JOIN invoices i ON i.invoice_id = p.invoice_id
       WHERE ${w}
       ORDER BY p.payment_id DESC
       LIMIT ? OFFSET ?`,
      [...params, q.limit, off]
    );
    return { rows, total };
  },

  async getById(paymentId: number): Promise<RowDataPacket | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.*, i.invoice_number
       FROM payments p
       LEFT JOIN invoices i ON i.invoice_id = p.invoice_id
       WHERE p.payment_id = ? LIMIT 1`,
      [paymentId]
    );
    return rows[0] ?? null;
  },

  async insert(
    invoiceId: number,
    customerId: number,
    paymentMethod: string,
    amount: number,
    markPaid: boolean
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
      if (markPaid) {
        await conn.query(`UPDATE invoices SET status = 'PAID', updated_at = CURRENT_TIMESTAMP WHERE invoice_id = ?`, [
          invoiceId
        ]);
      }
      await conn.commit();
      return payIns.insertId;
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  },

  async outstandingInvoices(): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT i.*, c.customer_name
       FROM invoices i
       INNER JOIN customers c ON c.customer_id = i.customer_id
       WHERE i.status IN ('DRAFT', 'CONFIRMED')
         AND (i.due_date IS NULL OR i.due_date < DATE_ADD(CURDATE(), INTERVAL 1 DAY))
       ORDER BY i.due_date ASC, i.invoice_id DESC`
    );
    return rows;
  },

  async summary(): Promise<RowDataPacket> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         COUNT(*) AS payment_count,
         COALESCE(SUM(CASE WHEN payment_status = 'SUCCESS' THEN amount ELSE 0 END), 0) AS total_collected,
         COALESCE(SUM(CASE WHEN payment_status = 'PENDING' THEN amount ELSE 0 END), 0) AS pending_amount
       FROM payments`
    );
    return rows[0] ?? {};
  }
};
