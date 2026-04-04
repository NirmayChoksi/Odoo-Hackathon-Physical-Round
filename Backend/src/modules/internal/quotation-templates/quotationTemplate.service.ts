import { fail } from "../../../utils/apiResponse";
import { quotationTemplateRepository } from "./quotationTemplate.repository";
import type {
  CreateTemplateBody,
  CreateTemplateItemBody,
  PatchTemplateBody,
  PatchTemplateItemBody,
  TemplateListQuery
} from "./quotationTemplate.types";

export const quotationTemplateService = {
  async list(q: TemplateListQuery) {
    const { rows, total } = await quotationTemplateRepository.list(q);
    return {
      templates: rows,
      pagination: {
        page: q.page,
        limit: q.limit,
        total,
        totalPages: Math.ceil(total / q.limit) || 0
      }
    };
  },

  async get(templateId: number) {
    const row = await quotationTemplateRepository.getById(templateId);
    if (!row) throw fail("Template not found", 404);
    return row;
  },

  async getWithItems(templateId: number) {
    const row = await this.get(templateId);
    const items = await quotationTemplateRepository.listItems(templateId);
    return { ...row, items };
  },

  async create(body: CreateTemplateBody) {
    const id = await quotationTemplateRepository.insert(body);
    return quotationTemplateRepository.getById(id);
  },

  async update(templateId: number, body: PatchTemplateBody) {
    const ok = await quotationTemplateRepository.update(templateId, body);
    if (!ok) throw fail("Template not found", 404);
    return quotationTemplateRepository.getById(templateId);
  },

  async remove(templateId: number) {
    const ok = await quotationTemplateRepository.softDelete(templateId);
    if (!ok) throw fail("Template not found", 404);
    return { template_id: templateId, deactivated: true };
  },

  async addItem(templateId: number, body: CreateTemplateItemBody) {
    await this.get(templateId);
    const id = await quotationTemplateRepository.insertItem(templateId, body);
    return quotationTemplateRepository.getItem(id);
  },

  async updateItem(templateItemId: number, body: PatchTemplateItemBody) {
    const ok = await quotationTemplateRepository.updateItem(templateItemId, body);
    if (!ok) throw fail("Template item not found", 404);
    return quotationTemplateRepository.getItem(templateItemId);
  },

  async deleteItem(templateItemId: number) {
    const row = await quotationTemplateRepository.getItem(templateItemId);
    if (!row) throw fail("Template item not found", 404);
    await quotationTemplateRepository.deleteItem(templateItemId);
    return { template_item_id: templateItemId, removed: true };
  }
};
