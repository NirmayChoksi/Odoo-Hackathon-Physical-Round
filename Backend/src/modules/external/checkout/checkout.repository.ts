import type { PoolConnection } from "mysql2/promise";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../../config/db";
export const checkoutRepository = {
  async ensureCustomerForUser(conn: PoolConnection, userId: number): Promise<number> {
    const [existing] = await conn.query<RowDataPacket[]>(
      `SELECT customer_id FROM customers WHERE portal_user_id = ? LIMIT 1`,
      [userId]
    );
    if (existing[0]?.customer_id) return existing[0].customer_id as number;

    const [users] = await conn.query<RowDataPacket[]>(
      `SELECT full_name, email, phone FROM users WHERE user_id = ? LIMIT 1`,
      [userId]
    );
    const u = users[0];
    if (!u) throw new Error("User not found");

    const [ins] = await conn.query<ResultSetHeader>(
      `INSERT INTO customers (customer_name, email, phone, portal_user_id, status)
       VALUES (?, ?, ?, ?, 'ACTIVE')`,
      [u.full_name, u.email ?? null, u.phone ?? null, userId]
    );
    return ins.insertId;
  },

  async placeOrderTransaction(
    userId: number,
    cartId: number,
    addressId: number,
    paymentMethod: string
  ): Promise<{ orderNumber: string; subscriptionId: number; invoiceId: number; paymentId: number }> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [addr] = await conn.query<RowDataPacket[]>(
        `SELECT * FROM user_addresses WHERE address_id = ? AND user_id = ? LIMIT 1`,
        [addressId, userId]
      );
      if (!addr[0]) throw new Error("ADDRESS_NOT_FOUND");

      const [cartRows] = await conn.query<RowDataPacket[]>(
        `SELECT applied_discount_id FROM carts WHERE cart_id = ? AND user_id = ? AND status = 'ACTIVE' LIMIT 1`,
        [cartId, userId]
      );
      if (!cartRows[0]) throw new Error("CART_NOT_FOUND");
      const appliedDiscountId = cartRows[0].applied_discount_id as number | null;

      const [lines] = await conn.query<RowDataPacket[]>(
        `SELECT ci.*, p.product_name
         FROM cart_items ci
         INNER JOIN products p ON p.product_id = ci.product_id
         WHERE ci.cart_id = ?
         ORDER BY ci.cart_item_id`,
        [cartId]
      );
      if (lines.length === 0) throw new Error("CART_EMPTY");

      const lineSubtotal = (r: RowDataPacket) =>
        (Number(r.unit_price) + Number(r.extra_price)) * Number(r.quantity);
      const subtotal = lines.reduce((s, r) => s + lineSubtotal(r), 0);
      const taxTotal = lines.reduce((s, r) => s + Number(r.tax_amount), 0);
      const discTotal = lines.reduce((s, r) => s + Number(r.discount_amount), 0);
      const grandTotal = lines.reduce((s, r) => s + Number(r.total_price), 0);

      const firstPlanId = lines[0].plan_id as number;

      const customerId = await this.ensureCustomerForUser(conn, userId);

      const [subIns] = await conn.query<ResultSetHeader>(
        `INSERT INTO subscriptions (
          customer_id, plan_id, template_id, start_date, status,
          subtotal, discount_amount, tax_amount, total_amount, created_by
        ) VALUES (?, ?, NULL, CURDATE(), 'ACTIVE', ?, ?, ?, ?, NULL)`,
        [customerId, firstPlanId, subtotal, discTotal, taxTotal, grandTotal]
      );
      const subscriptionId = subIns.insertId;

      const [subNumRows] = await conn.query<RowDataPacket[]>(
        `SELECT subscription_number FROM subscriptions WHERE subscription_id = ? LIMIT 1`,
        [subscriptionId]
      );
      const orderNumber = String(subNumRows[0]?.subscription_number ?? `SUB-${subscriptionId}`);

      for (const row of lines) {
        const unitCombined = Number(row.unit_price) + Number(row.extra_price);
        const amt = Number(row.total_price);
        await conn.query(
          `INSERT INTO subscription_items (
            subscription_id, product_id, variant_id, quantity, unit_price, tax_id, discount_id, amount
          ) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?)`,
          [
            subscriptionId,
            row.product_id,
            row.variant_id,
            row.quantity,
            unitCombined,
            amt
          ]
        );
      }

      const [invIns] = await conn.query<ResultSetHeader>(
        `INSERT INTO invoices (
          invoice_number, subscription_id, customer_id, invoice_date, due_date, status,
          subtotal, tax_amount, discount_amount, total_amount, notes
        ) VALUES (?, ?, ?, CURDATE(), NULL, 'PAID', ?, ?, ?, ?, ?)`,
        [orderNumber, subscriptionId, customerId, subtotal, taxTotal, discTotal, grandTotal, null]
      );
      const invoiceId = invIns.insertId;

      for (const row of lines) {
        const unitCombined = Number(row.unit_price) + Number(row.extra_price);
        await conn.query(
          `INSERT INTO invoice_items (
            invoice_id, product_id, description, quantity, unit_price, tax_id, discount_id, line_total
          ) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?)`,
          [invoiceId, row.product_id, row.product_name, row.quantity, unitCombined, Number(row.total_price)]
        );
      }

      const [payIns] = await conn.query<ResultSetHeader>(
        `INSERT INTO payments (
          invoice_id, customer_id, payment_method, amount, payment_date, payment_status, transaction_reference, notes
        ) VALUES (?, ?, ?, ?, CURDATE(), 'SUCCESS', NULL, NULL)`,
        [invoiceId, customerId, paymentMethod, grandTotal]
      );
      const paymentId = payIns.insertId;

      await conn.query(`UPDATE carts SET status = 'CHECKED_OUT', updated_at = CURRENT_TIMESTAMP WHERE cart_id = ?`, [
        cartId
      ]);

      if (appliedDiscountId) {
        await conn.query(`UPDATE discounts SET used_count = used_count + 1 WHERE discount_id = ?`, [
          appliedDiscountId
        ]);
      }

      await conn.commit();
      return { orderNumber, subscriptionId, invoiceId, paymentId };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }
};
