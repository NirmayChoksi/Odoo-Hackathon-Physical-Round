import { fail } from "../../../utils/apiResponse";
import { discountsRepository } from "./discounts.repository";
import type { CreateDiscountBody, PatchDiscountBody, DiscountListQuery } from "./discounts.types";

export const discountsService = {
  async list(q: DiscountListQuery) {
    const { rows, total } = await discountsRepository.list(q);
    return {
      discounts: rows,
      pagination: { total, page: q.page, limit: q.limit }
    };
  },

  async get(discountId: number) {
    const disc = await discountsRepository.getById(discountId);
    if (!disc) throw fail("Discount not found", 404);
    return disc;
  },

  async create(body: CreateDiscountBody, userId: number | null) {
    const discountId = await discountsRepository.insert(body, userId);
    return { discountId };
  },

  async update(discountId: number, body: PatchDiscountBody) {
    const updated = await discountsRepository.update(discountId, body);
    if (!updated) throw fail("Discount not found or no changes", 404);
    return { success: true };
  },

  async remove(discountId: number) {
    const deleted = await discountsRepository.softDelete(discountId);
    if (!deleted) throw fail("Discount not found", 404);
    return { success: true };
  }
};
