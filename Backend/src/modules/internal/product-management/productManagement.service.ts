import type { RowDataPacket } from "mysql2";
import { pool } from "../../../config/db";
import { fail } from "../../../utils/apiResponse";
import type {
  AttachPlanBody,
  CreateProductBody,
  CreateVariantBody,
  PatchProductBody,
  PatchVariantBody,
  ProductListQuery
} from "./productManagement.types";
import { productManagementRepository } from "./productManagement.repository";

async function planExists(planId: number): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1 FROM recurring_plans WHERE plan_id = ? LIMIT 1`,
    [planId]
  );
  return rows.length > 0;
}

export const productManagementService = {
  async list(q: ProductListQuery) {
    const { rows, total } = await productManagementRepository.list(q);
    return {
      products: rows,
      pagination: {
        page: q.page,
        limit: q.limit,
        total,
        totalPages: Math.ceil(total / q.limit) || 0
      }
    };
  },

  async get(productId: number) {
    const row = await productManagementRepository.getById(productId);
    if (!row) throw fail("Product not found", 404);
    return row;
  },

  async create(body: CreateProductBody, userId: number) {
    const id = await productManagementRepository.insert(body, userId);
    return productManagementRepository.getById(id);
  },

  async update(productId: number, body: PatchProductBody) {
    const ok = await productManagementRepository.update(productId, body);
    if (!ok) throw fail("Product not found", 404);
    return productManagementRepository.getById(productId);
  },

  async remove(productId: number) {
    const ok = await productManagementRepository.softDelete(productId);
    if (!ok) throw fail("Product not found", 404);
    return { product_id: productId, deactivated: true };
  },

  async listVariants(productId: number) {
    await this.get(productId);
    return productManagementRepository.listVariants(productId);
  },

  async createVariant(productId: number, body: CreateVariantBody) {
    await this.get(productId);
    const id = await productManagementRepository.insertVariant(productId, body);
    return productManagementRepository.getVariant(id);
  },

  async updateVariant(variantId: number, body: PatchVariantBody) {
    const v = await productManagementRepository.getVariant(variantId);
    if (!v) throw fail("Variant not found", 404);
    const ok = await productManagementRepository.updateVariant(variantId, body);
    if (!ok) throw fail("Variant not found", 404);
    return productManagementRepository.getVariant(variantId);
  },

  async deleteVariant(variantId: number) {
    const v = await productManagementRepository.getVariant(variantId);
    if (!v) throw fail("Variant not found", 404);
    await productManagementRepository.deleteVariant(variantId);
    return { variant_id: variantId, removed: true };
  },

  async attachPlan(productId: number, body: AttachPlanBody) {
    await this.get(productId);
    const ok = await planExists(body.planId);
    if (!ok) throw fail("Plan not found", 404);
    await productManagementRepository.attachPlan(productId, body);
    return { product_id: productId, plan_id: body.planId, attached: true };
  }
};
