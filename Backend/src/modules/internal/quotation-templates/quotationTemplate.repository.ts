import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../../config/db";
import { offset } from "../../../utils/pagination";
import type {
  CreateTemplateBody,
  CreateTemplateItemBody,
  PatchTemplateBody,
  PatchTemplateItemBody,
  TemplateListQuery
} from "./quotationTemplate.types";

export const quotationTemplateRepository = {
  async list(q: TemplateListQuery): Promise<{ rows: RowDataPacket[]; total: number }> {
    const off = offset(q.page, q.limit);
    const where: string[] = ["1=1"];
    const params: unknown[] = [];
    if (q.search) {
      where.push(`template_name LIKE ?`);
      params.push(`%${q.search}%`);
    }
    if (q.status) {
      where.push(`status = ?`);
      params.push(q.status);
    }
    const w = where.join(" AND ");
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM quotation_templates WHERE ${w}`,
      params
    );
    const total = Number(countRows[0]?.c ?? 0);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM quotation_templates WHERE ${w} ORDER BY template_id DESC LIMIT ? OFFSET ?`,
      [...params, q.limit, off]
    );
    return { rows, total };
  },

  async getById(templateId: number): Promise<RowDataPacket | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM quotation_templates WHERE template_id = ? LIMIT 1`,
      [templateId]
    );
    return rows[0] ?? null;
  },

  async insert(body: CreateTemplateBody): Promise<number> {
    const status = body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";
    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO quotation_templates (template_name, validity_days, plan_id, description, status)
       VALUES (?, ?, ?, ?, ?)`,
      [
        body.templateName,
        body.validityDays ?? 30,
        body.planId ?? null,
        body.description ?? null,
        status
      ]
    );
    return res.insertId;
  },

  async update(templateId: number, body: PatchTemplateBody): Promise<boolean> {
    const sets: string[] = [];
    const vals: unknown[] = [];
    if (body.templateName !== undefined) {
      sets.push("template_name = ?");
      vals.push(body.templateName);
    }
    if (body.validityDays !== undefined) {
      sets.push("validity_days = ?");
      vals.push(body.validityDays);
    }
    if (body.planId !== undefined) {
      sets.push("plan_id = ?");
      vals.push(body.planId);
    }
    if (body.description !== undefined) {
      sets.push("description = ?");
      vals.push(body.description || null);
    }
    if (body.status !== undefined) {
      sets.push("status = ?");
      vals.push(body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE");
    }
    if (!sets.length) return false;
    vals.push(templateId);
    const [r] = await pool.query<ResultSetHeader>(
      `UPDATE quotation_templates SET ${sets.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE template_id = ?`,
      vals
    );
    return r.affectedRows > 0;
  },

  async softDelete(templateId: number): Promise<boolean> {
    const [r] = await pool.query<ResultSetHeader>(
      `UPDATE quotation_templates SET status = 'INACTIVE', updated_at = CURRENT_TIMESTAMP WHERE template_id = ?`,
      [templateId]
    );
    return r.affectedRows > 0;
  },

  async listItems(templateId: number): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ti.*, p.product_name
       FROM quotation_template_items ti
       INNER JOIN products p ON p.product_id = ti.product_id
       WHERE ti.template_id = ?
       ORDER BY ti.template_item_id`,
      [templateId]
    );
    return rows;
  },

  async getItem(templateItemId: number): Promise<RowDataPacket | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM quotation_template_items WHERE template_item_id = ? LIMIT 1`,
      [templateItemId]
    );
    return rows[0] ?? null;
  },

  async insertItem(templateId: number, body: CreateTemplateItemBody): Promise<number> {
    const qty = body.quantity ?? 1;
    const line = qty * body.unitPrice;
    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO quotation_template_items (
        template_id, product_id, variant_id, quantity, unit_price, tax_id, line_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        templateId,
        body.productId,
        body.variantId ?? null,
        qty,
        body.unitPrice,
        body.taxId ?? null,
        line
      ]
    );
    return res.insertId;
  },

  async updateItem(templateItemId: number, body: PatchTemplateItemBody): Promise<boolean> {
    const existing = await this.getItem(templateItemId);
    if (!existing) return false;
    const qty = body.quantity ?? (existing.quantity as number);
    const unit = body.unitPrice ?? Number(existing.unit_price);
    const line = qty * unit;

    const sets: string[] = [];
    const vals: unknown[] = [];
    if (body.productId !== undefined) {
      sets.push("product_id = ?");
      vals.push(body.productId);
    }
    if (body.variantId !== undefined) {
      sets.push("variant_id = ?");
      vals.push(body.variantId);
    }
    if (body.quantity !== undefined) {
      sets.push("quantity = ?");
      vals.push(body.quantity);
    }
    if (body.unitPrice !== undefined) {
      sets.push("unit_price = ?");
      vals.push(body.unitPrice);
    }
    if (body.taxId !== undefined) {
      sets.push("tax_id = ?");
      vals.push(body.taxId);
    }
    sets.push("line_amount = ?");
    vals.push(line);
    vals.push(templateItemId);
    const [r] = await pool.query<ResultSetHeader>(
      `UPDATE quotation_template_items SET ${sets.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE template_item_id = ?`,
      vals
    );
    return r.affectedRows > 0;
  },

  async deleteItem(templateItemId: number): Promise<boolean> {
    const [r] = await pool.query<ResultSetHeader>(
      `DELETE FROM quotation_template_items WHERE template_item_id = ?`,
      [templateItemId]
    );
    return r.affectedRows > 0;
  }
};
