import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../../config/db";
import { offset } from "../../../utils/pagination";
import type {
  AttachPlanBody,
  CreateProductBody,
  CreateVariantBody,
  PatchProductBody,
  PatchVariantBody,
  ProductListQuery
} from "./productManagement.types";

export const productManagementRepository = {
  async list(q: ProductListQuery): Promise<{ rows: RowDataPacket[]; total: number }> {
    const off = offset(q.page, q.limit);
    const where: string[] = ["1=1"];
    const params: unknown[] = [];
    if (q.search) {
      where.push(`(product_name LIKE ? OR product_type LIKE ? OR short_description LIKE ?)`);
      const s = `%${q.search}%`;
      params.push(s, s, s);
    }
    if (q.status) {
      where.push(`status = ?`);
      params.push(q.status);
    }
    const w = where.join(" AND ");
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM products WHERE ${w}`,
      params
    );
    const total = Number(countRows[0]?.c ?? 0);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM products WHERE ${w} ORDER BY product_id DESC LIMIT ? OFFSET ?`,
      [...params, q.limit, off]
    );
    return { rows, total };
  },

  async getById(productId: number): Promise<RowDataPacket | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM products WHERE product_id = ? LIMIT 1`,
      [productId]
    );
    return rows[0] ?? null;
  },

  async insert(body: CreateProductBody, createdBy: number | null): Promise<number> {
    const status = body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";
    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO products (
        product_name, product_type, sales_price, cost_price, description, image_urls,
        short_description, terms_and_conditions, is_recurring, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.productName,
        body.productType,
        body.salesPrice,
        body.costPrice ?? 0,
        body.description ?? null,
        body.imageUrls ?? null,
        body.shortDescription ?? null,
        body.termsAndConditions ?? null,
        body.isRecurring !== false ? 1 : 0,
        status,
        createdBy
      ]
    );
    return res.insertId;
  },

  async update(productId: number, body: PatchProductBody): Promise<boolean> {
    const sets: string[] = [];
    const vals: unknown[] = [];
    if (body.productName !== undefined) {
      sets.push("product_name = ?");
      vals.push(body.productName);
    }
    if (body.productType !== undefined) {
      sets.push("product_type = ?");
      vals.push(body.productType);
    }
    if (body.salesPrice !== undefined) {
      sets.push("sales_price = ?");
      vals.push(body.salesPrice);
    }
    if (body.costPrice !== undefined) {
      sets.push("cost_price = ?");
      vals.push(body.costPrice);
    }
    if (body.description !== undefined) {
      sets.push("description = ?");
      vals.push(body.description || null);
    }
    if (body.imageUrls !== undefined) {
      sets.push("image_urls = ?");
      vals.push(body.imageUrls || null);
    }
    if (body.shortDescription !== undefined) {
      sets.push("short_description = ?");
      vals.push(body.shortDescription || null);
    }
    if (body.termsAndConditions !== undefined) {
      sets.push("terms_and_conditions = ?");
      vals.push(body.termsAndConditions || null);
    }
    if (body.isRecurring !== undefined) {
      sets.push("is_recurring = ?");
      vals.push(body.isRecurring ? 1 : 0);
    }
    if (body.status !== undefined) {
      sets.push("status = ?");
      vals.push(body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE");
    }
    if (!sets.length) return false;
    vals.push(productId);
    const [r] = await pool.query<ResultSetHeader>(
      `UPDATE products SET ${sets.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?`,
      vals
    );
    return r.affectedRows > 0;
  },

  async softDelete(productId: number): Promise<boolean> {
    const [r] = await pool.query<ResultSetHeader>(
      `UPDATE products SET status = 'INACTIVE', updated_at = CURRENT_TIMESTAMP WHERE product_id = ?`,
      [productId]
    );
    return r.affectedRows > 0;
  },

  async listVariants(productId: number): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM product_variants WHERE product_id = ? ORDER BY variant_id`,
      [productId]
    );
    return rows;
  },

  async getVariant(variantId: number): Promise<RowDataPacket | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM product_variants WHERE variant_id = ? LIMIT 1`,
      [variantId]
    );
    return rows[0] ?? null;
  },

  async insertVariant(productId: number, body: CreateVariantBody): Promise<number> {
    const status = body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";
    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO product_variants (product_id, attribute_name, attribute_value, extra_price, status)
       VALUES (?, ?, ?, ?, ?)`,
      [productId, body.attributeName, body.attributeValue, body.extraPrice ?? 0, status]
    );
    return res.insertId;
  },

  async updateVariant(variantId: number, body: PatchVariantBody): Promise<boolean> {
    const sets: string[] = [];
    const vals: unknown[] = [];
    if (body.attributeName !== undefined) {
      sets.push("attribute_name = ?");
      vals.push(body.attributeName);
    }
    if (body.attributeValue !== undefined) {
      sets.push("attribute_value = ?");
      vals.push(body.attributeValue);
    }
    if (body.extraPrice !== undefined) {
      sets.push("extra_price = ?");
      vals.push(body.extraPrice);
    }
    if (body.status !== undefined) {
      sets.push("status = ?");
      vals.push(body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE");
    }
    if (!sets.length) return false;
    vals.push(variantId);
    const [r] = await pool.query<ResultSetHeader>(
      `UPDATE product_variants SET ${sets.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE variant_id = ?`,
      vals
    );
    return r.affectedRows > 0;
  },

  async deleteVariant(variantId: number): Promise<boolean> {
    const [r] = await pool.query<ResultSetHeader>(`DELETE FROM product_variants WHERE variant_id = ?`, [variantId]);
    return r.affectedRows > 0;
  },

  async attachPlan(productId: number, body: AttachPlanBody): Promise<void> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      if (body.isDefault) {
        await conn.query(
          `UPDATE product_plans SET is_default = 0 WHERE product_id = ? AND status = 'ACTIVE'`,
          [productId]
        );
      }
      const st = body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";
      await conn.query(
        `INSERT INTO product_plans (product_id, plan_id, is_default, status)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE is_default = VALUES(is_default), status = VALUES(status), updated_at = CURRENT_TIMESTAMP`,
        [productId, body.planId, body.isDefault ? 1 : 0, st]
      );
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }
};
