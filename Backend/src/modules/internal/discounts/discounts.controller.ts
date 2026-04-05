import type { Request, Response } from "express";
import { fail, success } from "../../../utils/apiResponse";
import { getValidatedBody } from "../../../middlewares/validate.middleware";
import type { CreateDiscountBody, PatchDiscountBody } from "./discounts.types";
import { parseCreateDiscount, parsePatchDiscount, parseDiscountListQuery } from "./discounts.validation";
import { discountsService } from "./discounts.service";

export const discountsController = {
  async list(req: Request, res: Response): Promise<void> {
    const r = parseDiscountListQuery(req);
    if (!r.ok) {
      res.status(400).json({ success: false, message: "Invalid query", errors: r.errors });
      return;
    }
    const data = await discountsService.list(r.value);
    res.json(success(data));
  },

  async create(req: Request, res: Response): Promise<void> {
    const body = getValidatedBody<CreateDiscountBody>(req);
    const userId = (req as any).user?.user_id || null;
    const data = await discountsService.create(body, userId);
    res.status(201).json(success(data));
  },

  async get(req: Request, res: Response): Promise<void> {
    const discountId = Number(req.params.discountId);
    if (!Number.isInteger(discountId) || discountId < 1) throw fail("Invalid discountId", 400);
    const data = await discountsService.get(discountId);
    res.json(success(data));
  },

  async update(req: Request, res: Response): Promise<void> {
    const discountId = Number(req.params.discountId);
    if (!Number.isInteger(discountId) || discountId < 1) throw fail("Invalid discountId", 400);
    const body = getValidatedBody<PatchDiscountBody>(req);
    const data = await discountsService.update(discountId, body);
    res.json(success(data));
  },

  async remove(req: Request, res: Response): Promise<void> {
    const discountId = Number(req.params.discountId);
    if (!Number.isInteger(discountId) || discountId < 1) throw fail("Invalid discountId", 400);
    const data = await discountsService.remove(discountId);
    res.json(success(data));
  }
};
