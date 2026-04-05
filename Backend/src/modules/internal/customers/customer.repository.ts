import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../../config/db";
import { offset } from "../../../utils/pagination";
import type { CreateCustomerBody, CustomerListQuery, PatchCustomerBody } from "./customer.types";

export const customerRepository = {
  async list(q: CustomerListQuery): Promise<{ rows: RowDataPacket[]; total: number }> {
    const off = offset(q.page, q.limit);
    const where: string[] = ["1=1"];
    const params: unknown[] = [];
    if (q.search) {
      where.push(`(customer_name LIKE ? OR email LIKE ? OR phone LIKE ? OR company_name LIKE ?)`);
      const s = `%${q.search}%`;
      params.push(s, s, s, s);
    }
    const w = where.join(" AND ");
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM customers WHERE ${w}`,
      params
    );
    const total = Number(countRows[0]?.c ?? 0);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT customer_id, customer_name, email, company_name, phone, created_at, status
       FROM customers WHERE ${w} ORDER BY customer_id DESC LIMIT ? OFFSET ?`,
      [...params, q.limit, off]
    );
    return { rows, total };
  },

  async getById(customerId: number): Promise<RowDataPacket | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT customer_id, customer_name, email, phone, company_name, billing_address, shipping_address,
              tax_number, portal_user_id, status, created_at, updated_at
       FROM customers WHERE customer_id = ? LIMIT 1`,
      [customerId]
    );
    return rows[0] ?? null;
  },

  async insert(body: CreateCustomerBody): Promise<number> {
    const status = body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";
    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO customers (
        customer_name, email, phone, company_name, billing_address, shipping_address,
        tax_number, portal_user_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.customerName,
        body.email ?? null,
        body.phone ?? null,
        body.companyName ?? null,
        body.billingAddress ?? null,
        body.shippingAddress ?? null,
        body.taxNumber ?? null,
        body.portalUserId ?? null,
        status
      ]
    );
    return res.insertId;
  },

  async update(customerId: number, body: PatchCustomerBody): Promise<boolean> {
    const sets: string[] = [];
    const vals: unknown[] = [];
    const add = (col: string, v: unknown) => {
      sets.push(`${col} = ?`);
      vals.push(v);
    };
    if (body.customerName !== undefined) add("customer_name", body.customerName);
    if (body.email !== undefined) add("email", body.email || null);
    if (body.phone !== undefined) add("phone", body.phone || null);
    if (body.companyName !== undefined) add("company_name", body.companyName || null);
    if (body.billingAddress !== undefined) add("billing_address", body.billingAddress || null);
    if (body.shippingAddress !== undefined) add("shipping_address", body.shippingAddress || null);
    if (body.taxNumber !== undefined) add("tax_number", body.taxNumber || null);
    if (body.portalUserId !== undefined) add("portal_user_id", body.portalUserId);
    if (body.status !== undefined) add("status", body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE");
    if (!sets.length) return false;
    vals.push(customerId);
    const [r] = await pool.query<ResultSetHeader>(
      `UPDATE customers SET ${sets.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE customer_id = ?`,
      vals
    );
    return r.affectedRows > 0;
  },

  async softDelete(customerId: number): Promise<boolean> {
    const [r] = await pool.query<ResultSetHeader>(
      `UPDATE customers SET status = 'INACTIVE', updated_at = CURRENT_TIMESTAMP WHERE customer_id = ?`,
      [customerId]
    );
    return r.affectedRows > 0;
  }
};
