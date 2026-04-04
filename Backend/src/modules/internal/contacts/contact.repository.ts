import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../../config/db";
import type { CreateContactBody, PatchContactBody } from "./contact.types";

export const contactRepository = {
  async listByCustomer(customerId: number): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM contacts WHERE customer_id = ? ORDER BY contact_id DESC`,
      [customerId]
    );
    return rows;
  },

  async getById(contactId: number): Promise<RowDataPacket | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM contacts WHERE contact_id = ? LIMIT 1`,
      [contactId]
    );
    return rows[0] ?? null;
  },

  async insert(customerId: number, body: CreateContactBody): Promise<number> {
    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO contacts (customer_id, contact_name, email, phone, designation)
       VALUES (?, ?, ?, ?, ?)`,
      [customerId, body.contactName, body.email ?? null, body.phone ?? null, body.designation ?? null]
    );
    return res.insertId;
  },

  async update(contactId: number, body: PatchContactBody): Promise<boolean> {
    const sets: string[] = [];
    const vals: unknown[] = [];
    if (body.contactName !== undefined) {
      sets.push("contact_name = ?");
      vals.push(body.contactName);
    }
    if (body.email !== undefined) {
      sets.push("email = ?");
      vals.push(body.email || null);
    }
    if (body.phone !== undefined) {
      sets.push("phone = ?");
      vals.push(body.phone || null);
    }
    if (body.designation !== undefined) {
      sets.push("designation = ?");
      vals.push(body.designation || null);
    }
    if (!sets.length) return false;
    vals.push(contactId);
    const [r] = await pool.query<ResultSetHeader>(
      `UPDATE contacts SET ${sets.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE contact_id = ?`,
      vals
    );
    return r.affectedRows > 0;
  },

  async delete(contactId: number): Promise<boolean> {
    const [r] = await pool.query<ResultSetHeader>(`DELETE FROM contacts WHERE contact_id = ?`, [contactId]);
    return r.affectedRows > 0;
  }
};
