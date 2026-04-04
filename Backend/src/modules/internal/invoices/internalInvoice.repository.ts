import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../../config/db";
import { offset } from "../../../utils/pagination";
import type { InternalInvoiceListQuery } from "./internalInvoice.types";

export const internalInvoiceRepository = {
  async list(q: InternalInvoiceListQuery): Promise<{ rows: RowDataPacket[]; total: number }> {
    const off = offset(q.page, q.limit);
    const where: string[] = ["1=1"];
    const params: unknown[] = [];
    if (q.status) {
      where.push(`i.status = ?`);
      params.push(q.status);
    }
    if (q.customerId) {
      where.push(`i.customer_id = ?`);
      params.push(q.customerId);
    }
    const w = where.join(" AND ");
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM invoices i WHERE ${w}`,
      params
    );
    const total = Number(countRows[0]?.c ?? 0);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT i.*, s.subscription_number, c.customer_name
       FROM invoices i
       LEFT JOIN subscriptions s ON s.subscription_id = i.subscription_id
       LEFT JOIN customers c ON c.customer_id = i.customer_id
       WHERE ${w}
       ORDER BY i.invoice_id DESC
       LIMIT ? OFFSET ?`,
      [...params, q.limit, off]
    );
    return { rows, total };
  },

  async getById(invoiceId: number): Promise<RowDataPacket | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT i.*, s.subscription_number, c.customer_name, c.email AS customer_email
       FROM invoices i
       LEFT JOIN subscriptions s ON s.subscription_id = i.subscription_id
       LEFT JOIN customers c ON c.customer_id = i.customer_id
       WHERE i.invoice_id = ? LIMIT 1`,
      [invoiceId]
    );
    return rows[0] ?? null;
  },

  async listItems(invoiceId: number): Promise<RowDataPacket[]> {
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

  async setStatus(invoiceId: number, status: string): Promise<boolean> {
    const [r] = await pool.query<ResultSetHeader>(
      `UPDATE invoices SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE invoice_id = ?`,
      [status, invoiceId]
    );
    return r.affectedRows > 0;
  },

  async appendNote(invoiceId: number, note: string): Promise<boolean> {
    const [r] = await pool.query<ResultSetHeader>(
      `UPDATE invoices SET notes = CONCAT(COALESCE(notes, ''), ?), updated_at = CURRENT_TIMESTAMP WHERE invoice_id = ?`,
      [`\n${note}`, invoiceId]
    );
    return r.affectedRows > 0;
  }
};
