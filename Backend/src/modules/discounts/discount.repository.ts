import { pool } from "../../config/db";
import type { DiscountRow } from "./discount.types";

export type { DiscountRow } from "./discount.types";

export const discountRepository = {
  async findActiveByCouponCode(code: string): Promise<DiscountRow | null> {
    const normalized = code.trim();
    if (!normalized) return null;
    const [rows] = await pool.query<DiscountRow[]>(
      `SELECT * FROM discounts
       WHERE status = 'ACTIVE'
         AND (coupon_code = :code OR discount_name = :code)
         AND (start_date IS NULL OR start_date <= CURDATE())
         AND (end_date IS NULL OR end_date >= CURDATE())
       LIMIT 1`,
      { code: normalized }
    );
    return rows[0] ?? null;
  },

  async findById(id: number): Promise<DiscountRow | null> {
    const [rows] = await pool.query<DiscountRow[]>(
      `SELECT * FROM discounts WHERE discount_id = :id LIMIT 1`,
      { id }
    );
    return rows[0] ?? null;
  }
};
