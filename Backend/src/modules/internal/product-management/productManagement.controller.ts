import type { Request, Response } from "express";
import { fail, success } from "../../../utils/apiResponse";
import { getValidatedBody } from "../../../middlewares/validate.middleware";
import type {
  AttachPlanBody,
  CreateProductBody,
  CreateVariantBody,
  PatchProductBody,
  PatchVariantBody
} from "./productManagement.types";
import {
  parseAttachPlan,
  parseCreateProduct,
  parseCreateVariant,
  parsePatchProduct,
  parseProductListQuery
} from "./productManagement.validation";
import { productManagementService } from "./productManagement.service";

export const productManagementController = {
  async list(req: Request, res: Response): Promise<void> {
    const r = parseProductListQuery(req);
    if (!r.ok) {
      res.status(400).json({ success: false, message: "Invalid query", errors: r.errors });
      return;
    }
    const data = await productManagementService.list(r.value);
    res.json(success(data));
  },

  async create(req: Request, res: Response): Promise<void> {
    const body = getValidatedBody<CreateProductBody>(req);
    const data = await productManagementService.create(body, req.userId!);
    res.status(201).json(success(data));
  },

  async listVariants(req: Request, res: Response): Promise<void> {
    const productId = Number(req.params.productId);
    if (!Number.isInteger(productId) || productId < 1) throw fail("Invalid productId", 400);
    const rows = await productManagementService.listVariants(productId);
    res.json(success({ variants: rows }));
  },

  async createVariant(req: Request, res: Response): Promise<void> {
    const productId = Number(req.params.productId);
    if (!Number.isInteger(productId) || productId < 1) throw fail("Invalid productId", 400);
    const body = getValidatedBody<CreateVariantBody>(req);
    const data = await productManagementService.createVariant(productId, body);
    res.status(201).json(success(data));
  },

  async attachPlan(req: Request, res: Response): Promise<void> {
    const productId = Number(req.params.productId);
    if (!Number.isInteger(productId) || productId < 1) throw fail("Invalid productId", 400);
    const body = getValidatedBody<AttachPlanBody>(req);
    const data = await productManagementService.attachPlan(productId, body);
    res.status(201).json(success(data));
  },

  async get(req: Request, res: Response): Promise<void> {
    const productId = Number(req.params.productId);
    if (!Number.isInteger(productId) || productId < 1) throw fail("Invalid productId", 400);
    const data = await productManagementService.get(productId);
    res.json(success(data));
  },

  async update(req: Request, res: Response): Promise<void> {
    const productId = Number(req.params.productId);
    if (!Number.isInteger(productId) || productId < 1) throw fail("Invalid productId", 400);
    const body = getValidatedBody<PatchProductBody>(req);
    const data = await productManagementService.update(productId, body);
    res.json(success(data));
  },

  async remove(req: Request, res: Response): Promise<void> {
    const productId = Number(req.params.productId);
    if (!Number.isInteger(productId) || productId < 1) throw fail("Invalid productId", 400);
    const data = await productManagementService.remove(productId);
    res.json(success(data));
  }
};
