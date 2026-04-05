import type { Request, Response } from "express";
import { fail, success } from "../../../utils/apiResponse";
import { getValidatedBody } from "../../../middlewares/validate.middleware";
import type { CreateTaxBody, PatchTaxBody } from "./taxes.types";
import { parseCreateTax, parsePatchTax, parseTaxListQuery } from "./taxes.validation";
import { taxesService } from "./taxes.service";

export const taxesController = {
  async list(req: Request, res: Response): Promise<void> {
    const r = parseTaxListQuery(req);
    if (!r.ok) {
      res.status(400).json({ success: false, message: "Invalid query", errors: r.errors });
      return;
    }
    const data = await taxesService.list(r.value);
    res.json(success(data));
  },

  async create(req: Request, res: Response): Promise<void> {
    const body = getValidatedBody<CreateTaxBody>(req);
    const data = await taxesService.create(body);
    res.status(201).json(success(data));
  },

  async get(req: Request, res: Response): Promise<void> {
    const taxId = Number(req.params.taxId);
    if (!Number.isInteger(taxId) || taxId < 1) throw fail("Invalid taxId", 400);
    const data = await taxesService.get(taxId);
    res.json(success(data));
  },

  async update(req: Request, res: Response): Promise<void> {
    const taxId = Number(req.params.taxId);
    if (!Number.isInteger(taxId) || taxId < 1) throw fail("Invalid taxId", 400);
    const body = getValidatedBody<PatchTaxBody>(req);
    const data = await taxesService.update(taxId, body);
    res.json(success(data));
  },

  async remove(req: Request, res: Response): Promise<void> {
    const taxId = Number(req.params.taxId);
    if (!Number.isInteger(taxId) || taxId < 1) throw fail("Invalid taxId", 400);
    const data = await taxesService.remove(taxId);
    res.json(success(data));
  }
};
