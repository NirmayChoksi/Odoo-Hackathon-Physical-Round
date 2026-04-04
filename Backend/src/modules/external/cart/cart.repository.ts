import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { pool } from "../../config/db";
import type { CartItemRow } from "./cart.types";

export const cartRepository = {
  async getActiveCartId(userId: number): Promise<number | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT cart_id FROM carts WHERE user_id = :userId AND status = 'ACTIVE'
       ORDER BY updated_at DESC LIMIT 1`,
      { userId }
    );
    return rows[0]?.cart_id ?? null;
  },

  async createCart(userId: number): Promise<number> {
    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO carts (user_id, status) VALUES (:userId, 'ACTIVE')`,
      { userId }
    );
    return res.insertId;
  },

  async getOrCreateActiveCartId(userId: number): Promise<number> {
    const existing = await this.getActiveCartId(userId);
    if (existing) return existing;
    return this.createCart(userId);
  },

  async findLine(
    cartId: number,
    productId: number,
    planId: number,
    variantId: number | null
  ): Promise<{ cart_item_id: number; quantity: number } | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT cart_item_id, quantity FROM cart_items
       WHERE cart_id = :cartId AND product_id = :productId AND plan_id = :planId
         AND variant_id <=> :variantId
       LIMIT 1`,
      { cartId, productId, planId, variantId }
    );
    const r = rows[0];
    return r ? { cart_item_id: r.cart_item_id, quantity: r.quantity } : null;
  },

  async insertItem(
    cartId: number,
    productId: number,
    planId: number,
    variantId: number | null,
    quantity: number,
    unitPrice: number,
    totalPrice: number
  ): Promise<number> {
    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO cart_items (cart_id, product_id, plan_id, variant_id, quantity, unit_price, total_price)
       VALUES (:cartId, :productId, :planId, :variantId, :quantity, :unitPrice, :totalPrice)`,
      {
        cartId,
        productId,
        planId,
        variantId,
        quantity,
        unitPrice,
        totalPrice
      }
    );
    return res.insertId;
  },

  async updateLineQuantity(cartItemId: number, quantity: number, unitPrice: number): Promise<void> {
    const total = unitPrice * quantity;
    await pool.query(
      `UPDATE cart_items SET quantity = :quantity, total_price = :total, updated_at = CURRENT_TIMESTAMP
       WHERE cart_item_id = :cartItemId`,
      { quantity, total, cartItemId }
    );
  },

  async deleteLine(cartItemId: number): Promise<boolean> {
    const [res] = await pool.query<ResultSetHeader>(
      `DELETE FROM cart_items WHERE cart_item_id = :id`,
      { id: cartItemId }
    );
    return res.affectedRows > 0;
  },

  async itemBelongsToUser(cartItemId: number, userId: number): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 1 FROM cart_items ci
       INNER JOIN carts c ON c.cart_id = ci.cart_id AND c.user_id = :userId AND c.status = 'ACTIVE'
       WHERE ci.cart_item_id = :cartItemId LIMIT 1`,
      { cartItemId, userId }
    );
    return rows.length > 0;
  },

  async getLineForPricing(cartItemId: number, userId: number): Promise<{ unit_price: string } | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ci.unit_price FROM cart_items ci
       INNER JOIN carts c ON c.cart_id = ci.cart_id AND c.user_id = :userId AND c.status = 'ACTIVE'
       WHERE ci.cart_item_id = :cartItemId LIMIT 1`,
      { cartItemId, userId }
    );
    const r = rows[0];
    return r ? { unit_price: String(r.unit_price) } : null;
  },

  async listItemsWithDetails(cartId: number): Promise<CartItemRow[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        ci.cart_item_id,
        ci.cart_id,
        ci.product_id,
        ci.plan_id,
        ci.variant_id,
        ci.quantity,
        ci.unit_price,
        ci.total_price,
        p.product_name,
        rp.plan_name,
        rp.billing_period
      FROM cart_items ci
      INNER JOIN products p ON p.product_id = ci.product_id
      INNER JOIN recurring_plans rp ON rp.plan_id = ci.plan_id
      WHERE ci.cart_id = :cartId
      ORDER BY ci.cart_item_id ASC`,
      { cartId }
    );
    return rows.map((r) => ({
      cart_item_id: r.cart_item_id,
      cart_id: r.cart_id,
      product_id: r.product_id,
      plan_id: r.plan_id,
      variant_id: r.variant_id,
      quantity: r.quantity,
      unit_price: String(r.unit_price),
      total_price: String(r.total_price),
      product_name: r.product_name,
      plan_name: r.plan_name,
      billing_period: r.billing_period
    }));
  },

  async sumQuantityForCart(cartId: number): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(quantity), 0) AS n FROM cart_items WHERE cart_id = :cartId`,
      { cartId }
    );
    return Number(rows[0]?.n ?? 0);
  }
};
