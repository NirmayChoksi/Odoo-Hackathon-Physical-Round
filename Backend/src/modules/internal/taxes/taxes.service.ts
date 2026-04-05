import { fail } from "../../../utils/apiResponse";
import { taxesRepository } from "./taxes.repository";
import type { CreateTaxBody, PatchTaxBody, TaxListQuery } from "./taxes.types";

export const taxesService = {
  async list(q: TaxListQuery) {
    const { rows, total } = await taxesRepository.list(q);
    return {
      taxes: rows,
      pagination: { total, page: q.page, limit: q.limit }
    };
  },

  async get(taxId: number) {
    const tax = await taxesRepository.getById(taxId);
    if (!tax) throw fail("Tax not found", 404);
    return tax;
  },

  async create(body: CreateTaxBody) {
    const taxId = await taxesRepository.insert(body);
    return { taxId };
  },

  async update(taxId: number, body: PatchTaxBody) {
    const updated = await taxesRepository.update(taxId, body);
    if (!updated) throw fail("Tax not found or no changes", 404);
    return { success: true };
  },

  async remove(taxId: number) {
    const deleted = await taxesRepository.softDelete(taxId);
    if (!deleted) throw fail("Tax not found", 404);
    return { success: true };
  }
};
