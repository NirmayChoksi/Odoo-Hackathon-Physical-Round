import type { Request, Response } from "express";
import { fail, success } from "../../../utils/apiResponse";
import { getValidatedBody } from "../../../middlewares/validate.middleware";
import type {
  CreateTemplateBody,
  CreateTemplateItemBody,
  PatchTemplateBody,
  PatchTemplateItemBody
} from "./quotationTemplate.types";
import {
  parseCreateTemplate,
  parseCreateTemplateItem,
  parsePatchTemplate,
  parseTemplateListQuery
} from "./quotationTemplate.validation";
import { quotationTemplateService } from "./quotationTemplate.service";

export const quotationTemplateController = {
  async list(req: Request, res: Response): Promise<void> {
    const r = parseTemplateListQuery(req);
    if (!r.ok) {
      res.status(400).json({ success: false, message: "Invalid query", errors: r.errors });
      return;
    }
    const data = await quotationTemplateService.list(r.value);
    res.json(success(data));
  },

  async create(req: Request, res: Response): Promise<void> {
    const body = getValidatedBody<CreateTemplateBody>(req);
    const data = await quotationTemplateService.create(body);
    res.status(201).json(success(data));
  },

  async get(req: Request, res: Response): Promise<void> {
    const templateId = Number(req.params.templateId);
    if (!Number.isInteger(templateId) || templateId < 1) throw fail("Invalid templateId", 400);
    const data = await quotationTemplateService.getWithItems(templateId);
    res.json(success(data));
  },

  async update(req: Request, res: Response): Promise<void> {
    const templateId = Number(req.params.templateId);
    if (!Number.isInteger(templateId) || templateId < 1) throw fail("Invalid templateId", 400);
    const body = getValidatedBody<PatchTemplateBody>(req);
    const data = await quotationTemplateService.update(templateId, body);
    res.json(success(data));
  },

  async remove(req: Request, res: Response): Promise<void> {
    const templateId = Number(req.params.templateId);
    if (!Number.isInteger(templateId) || templateId < 1) throw fail("Invalid templateId", 400);
    const data = await quotationTemplateService.remove(templateId);
    res.json(success(data));
  },

  async addItem(req: Request, res: Response): Promise<void> {
    const templateId = Number(req.params.templateId);
    if (!Number.isInteger(templateId) || templateId < 1) throw fail("Invalid templateId", 400);
    const body = getValidatedBody<CreateTemplateItemBody>(req);
    const data = await quotationTemplateService.addItem(templateId, body);
    res.status(201).json(success(data));
  },

  async updateTemplateItem(req: Request, res: Response): Promise<void> {
    const templateId = Number(req.params.templateId);
    const itemId = Number(req.params.itemId);
    if (!Number.isInteger(templateId) || templateId < 1 || !Number.isInteger(itemId) || itemId < 1) {
      throw fail("Invalid templateId or itemId", 400);
    }
    const body = getValidatedBody<PatchTemplateItemBody>(req);
    const data = await quotationTemplateService.updateTemplateItem(templateId, itemId, body);
    res.json(success(data));
  },

  async deleteTemplateItem(req: Request, res: Response): Promise<void> {
    const templateId = Number(req.params.templateId);
    const itemId = Number(req.params.itemId);
    if (!Number.isInteger(templateId) || templateId < 1 || !Number.isInteger(itemId) || itemId < 1) {
      throw fail("Invalid templateId or itemId", 400);
    }
    const data = await quotationTemplateService.deleteTemplateItem(templateId, itemId);
    res.json(success(data));
  }
};
