import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../../config/db";
import type { CartItemRow } from "./cart.types";

export interface CartMeta extends RowDataPacket {
  cart_id: number;
  applied_discount_id: number | null;
  payment_method: string | null;
  selected_address_id: number | null;
}

export interface CartItemFullRow extends RowDataPacket {
  cart_item_id: number;
  cart_id: number;
  product_id: number;
  plan_id: number;
  variant_id: number | null;
  quantity: number;
  unit_price: string;
  extra_price: string;
  tax_amount: string;
  discount_amount: string;
  total_price: string;
}

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

  async getCartMeta(cartId: number): Promise<CartMeta | null> {
    const [rows] = await pool.query<CartMeta[]>(
      `SELECT cart_id, applied_discount_id, payment_method, selected_address_id FROM carts WHERE cart_id = :id LIMIT 1`,
      { id: cartId }
    );
    return rows[0] ?? null;
  },

  async setSelectedAddress(cartId: number, addressId: number | null): Promise<void> {
    await pool.query(
      `UPDATE carts SET selected_address_id = :a, updated_at = CURRENT_TIMESTAMP WHERE cart_id = :id`,
      { a: addressId, id: cartId }
    );
  },

  async setAppliedDiscount(cartId: number, discountId: number | null): Promise<void> {
    await pool.query(`UPDATE carts SET applied_discount_id = :d, updated_at = CURRENT_TIMESTAMP WHERE cart_id = :id`, {
      d: discountId,
      id: cartId
    });
  },

  async setPaymentMethod(cartId: number, method: string | null): Promise<void> {
    await pool.query(`UPDATE carts SET payment_method = :m, updated_at = CURRENT_TIMESTAMP WHERE cart_id = :id`, {
      m: method,
      id: cartId
    });
  },

  async markCheckedOut(cartId: number): Promise<void> {
    await pool.query(`UPDATE carts SET status = 'CHECKED_OUT', updated_at = CURRENT_TIMESTAMP WHERE cart_id = :id`, {
      id: cartId
    });
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
    extraPrice: number,
    taxAmount: number,
    discountAmount: number,
    totalPrice: number
  ): Promise<number> {
    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO cart_items (
        cart_id, product_id, plan_id, variant_id, quantity,
        unit_price, extra_price, tax_amount, discount_amount, total_price
      ) VALUES (
        :cartId, :productId, :planId, :variantId, :quantity,
        :unitPrice, :extraPrice, :taxAmount, :discountAmount, :totalPrice
      )`,
      {
        cartId,
        productId,
        planId,
        variantId,
        quantity,
        unitPrice,
        extraPrice,
        taxAmount,
        discountAmount,
        totalPrice
      }
    );
    return res.insertId;
  },

  async updateLinePricing(
    cartItemId: number,
    fields: {
      product_id: number;
      plan_id: number;
      variant_id: number | null;
      quantity: number;
      unit_price: number;
      extra_price: number;
      tax_amount: number;
      discount_amount: number;
      total_price: number;
    }
  ): Promise<void> {
    await pool.query(
      `UPDATE cart_items SET
        product_id = :product_id,
        plan_id = :plan_id,
        variant_id = :variant_id,
        quantity = :quantity,
        unit_price = :unit_price,
        extra_price = :extra_price,
        tax_amount = :tax_amount,
        discount_amount = :discount_amount,
        total_price = :total_price,
        updated_at = CURRENT_TIMESTAMP
      WHERE cart_item_id = :cartItemId`,
      { ...fields, cartItemId }
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

  async getItemFull(cartItemId: number, userId: number): Promise<CartItemFullRow | null> {
    const [rows] = await pool.query<CartItemFullRow[]>(
      `SELECT ci.* FROM cart_items ci
       INNER JOIN carts c ON c.cart_id = ci.cart_id AND c.user_id = :userId AND c.status = 'ACTIVE'
       WHERE ci.cart_item_id = :cartItemId LIMIT 1`,
      { cartItemId, userId }
    );
    return rows[0] ?? null;
  },

  async listItemsRaw(cartId: number): Promise<CartItemFullRow[]> {
    const [rows] = await pool.query<CartItemFullRow[]>(
      `SELECT * FROM cart_items WHERE cart_id = :cartId ORDER BY cart_item_id`,
      { cartId }
    );
    return rows;
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
        ci.extra_price,
        ci.tax_amount,
        ci.discount_amount,
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
    return rows.map((r: RowDataPacket) => ({
      cart_item_id: r.cart_item_id,
      cart_id: r.cart_id,
      product_id: r.product_id,
      plan_id: r.plan_id,
      variant_id: r.variant_id,
      quantity: r.quantity,
      unit_price: String(r.unit_price),
      extra_price: String(r.extra_price),
      tax_amount: String(r.tax_amount),
      discount_amount: String(r.discount_amount),
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
