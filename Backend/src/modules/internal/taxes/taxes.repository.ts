import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../../config/db";
import { offset } from "../../../utils/pagination";
import type { CreateTaxBody, PatchTaxBody, TaxListQuery } from "./taxes.types";

export const taxesRepository = {
  async list(q: TaxListQuery): Promise<{ rows: RowDataPacket[]; total: number }> {
    const off = offset(q.page, q.limit);
    const where: string[] = ["1=1"];
    const params: unknown[] = [];
    
    if (q.search) {
      where.push(`(tax_name LIKE ? OR description LIKE ?)`);
      const s = `%${q.search}%`;
      params.push(s, s);
    }
    
    if (q.status) {
      where.push(`status = ?`);
      params.push(q.status);
    }
    
    const w = where.join(" AND ");
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM taxes WHERE ${w}`,
      params
    );
    const total = Number(countRows[0]?.c ?? 0);
    
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM taxes WHERE ${w} ORDER BY tax_id DESC LIMIT ? OFFSET ?`,
      [...params, q.limit, off]
    );
    
    return { rows, total };
  },

  async getById(taxId: number): Promise<RowDataPacket | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM taxes WHERE tax_id = ? LIMIT 1`,
      [taxId]
    );
    return rows[0] ?? null;
  },

  async insert(body: CreateTaxBody): Promise<number> {
    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO taxes (tax_name, tax_type, tax_percentage, description, status) VALUES (?, ?, ?, ?, ?)`,
      [body.taxName, body.taxType, body.taxPercentage, body.description ?? null, body.status ?? 'ACTIVE']
    );
    return res.insertId;
  },

  async update(taxId: number, body: PatchTaxBody): Promise<boolean> {
    const sets: string[] = [];
    const vals: unknown[] = [];
    
    if (body.taxName !== undefined) { sets.push("tax_name = ?"); vals.push(body.taxName); }
    if (body.taxType !== undefined) { sets.push("tax_type = ?"); vals.push(body.taxType); }
    if (body.taxPercentage !== undefined) { sets.push("tax_percentage = ?"); vals.push(body.taxPercentage); }
    if (body.description !== undefined) { sets.push("description = ?"); vals.push(body.description || null); }
    if (body.status !== undefined) { sets.push("status = ?"); vals.push(body.status); }
    
    if (!sets.length) return false;
    
    vals.push(taxId);
    const [r] = await pool.query<ResultSetHeader>(
      `UPDATE taxes SET ${sets.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE tax_id = ?`,
      vals
    );
    return r.affectedRows > 0;
  },

  async softDelete(taxId: number): Promise<boolean> {
    const [r] = await pool.query<ResultSetHeader>(
      `UPDATE taxes SET status = 'INACTIVE', updated_at = CURRENT_TIMESTAMP WHERE tax_id = ?`,
      [taxId]
    );
    return r.affectedRows > 0;
  }
};
