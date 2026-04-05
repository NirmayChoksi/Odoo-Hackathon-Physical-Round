import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../../config/db";
import { offset } from "../../../utils/pagination";
import type { CreateDiscountBody, PatchDiscountBody, DiscountListQuery } from "./discounts.types";

export const discountsRepository = {
  async list(q: DiscountListQuery): Promise<{ rows: RowDataPacket[]; total: number }> {
    const off = offset(q.page, q.limit);
    const where: string[] = ["1=1"];
    const params: unknown[] = [];
    
    if (q.search) {
      where.push(`(discount_name LIKE ? OR coupon_code LIKE ?)`);
      const s = `%${q.search}%`;
      params.push(s, s);
    }
    
    if (q.status) {
      where.push(`status = ?`);
      params.push(q.status);
    }
    
    const w = where.join(" AND ");
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM discounts WHERE ${w}`,
      params
    );
    const total = Number(countRows[0]?.c ?? 0);
    
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM discounts WHERE ${w} ORDER BY discount_id DESC LIMIT ? OFFSET ?`,
      [...params, q.limit, off]
    );
    
    return { rows, total };
  },

  async getById(discountId: number): Promise<RowDataPacket | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM discounts WHERE discount_id = ? LIMIT 1`,
      [discountId]
    );
    return rows[0] ?? null;
  },

  async insert(body: CreateDiscountBody, createdBy: number | null): Promise<number> {
    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO discounts (
        discount_name, coupon_code, discount_type, discount_value, 
        minimum_purchase, minimum_quantity, start_date, end_date, 
        limit_usage, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.discountName,
        body.couponCode != null && String(body.couponCode).trim() !== "" ? String(body.couponCode).trim() : null,
        body.discountType,
        body.discountValue,
        body.minimumPurchase ?? 0,
        body.minimumQuantity ?? 1,
        body.startDate ?? null,
        body.endDate ?? null,
        body.limitUsage ?? null,
        body.status ?? 'ACTIVE',
        createdBy
      ]
    );
    return res.insertId;
  },

  async update(discountId: number, body: PatchDiscountBody): Promise<boolean> {
    const sets: string[] = [];
    const vals: unknown[] = [];
    const add = (col: string, val: unknown) => { sets.push(`${col} = ?`); vals.push(val); };
    
    if (body.discountName !== undefined) add("discount_name", body.discountName);
    if (body.couponCode !== undefined) add("coupon_code", body.couponCode || null);
    if (body.discountType !== undefined) add("discount_type", body.discountType);
    if (body.discountValue !== undefined) add("discount_value", body.discountValue);
    if (body.minimumPurchase !== undefined) add("minimum_purchase", body.minimumPurchase);
    if (body.minimumQuantity !== undefined) add("minimum_quantity", body.minimumQuantity);
    if (body.startDate !== undefined) add("start_date", body.startDate || null);
    if (body.endDate !== undefined) add("end_date", body.endDate || null);
    if (body.limitUsage !== undefined) add("limit_usage", body.limitUsage);
    if (body.status !== undefined) add("status", body.status);
    
    if (!sets.length) return false;
    
    vals.push(discountId);
    const [r] = await pool.query<ResultSetHeader>(
      `UPDATE discounts SET ${sets.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE discount_id = ?`,
      vals
    );
    return r.affectedRows > 0;
  },

  async softDelete(discountId: number): Promise<boolean> {
    const [r] = await pool.query<ResultSetHeader>(
      `UPDATE discounts SET status = 'INACTIVE', updated_at = CURRENT_TIMESTAMP WHERE discount_id = ?`,
      [discountId]
    );
    return r.affectedRows > 0;
  }
};
