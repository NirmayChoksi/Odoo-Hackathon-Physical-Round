import type { RowDataPacket } from "mysql2";
import { pool } from "../../config/db";
import type { ProductRow } from "./product.types";

export const productRepository = {
  async findActiveById(productId: number): Promise<ProductRow | null> {
    const [rows] = await pool.query<ProductRow[]>(
      `SELECT * FROM products WHERE product_id = :id AND status = 'ACTIVE' LIMIT 1`,
      { id: productId }
    );
    return rows[0] ?? null;
  },

  async existsActive(productId: number): Promise<boolean> {
    const r = await this.findActiveById(productId);
    return r !== null;
  },

  async productHasPlan(productId: number, planId: number): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 1 FROM product_plans
       WHERE product_id = :productId AND plan_id = :planId AND status = 'ACTIVE' LIMIT 1`,
      { productId, planId }
    );
    return rows.length > 0;
  },

  async findActiveVariantForProduct(
    variantId: number,
    productId: number
  ): Promise<{ extra_price: string } | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT extra_price FROM product_variants
       WHERE variant_id = :variantId AND product_id = :productId AND status = 'ACTIVE' LIMIT 1`,
      { variantId, productId }
    );
    const r = rows[0];
    return r ? { extra_price: String(r.extra_price) } : null;
  }
};
