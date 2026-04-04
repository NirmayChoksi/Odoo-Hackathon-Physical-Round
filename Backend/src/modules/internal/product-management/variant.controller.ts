import type { Request, Response } from "express";
import { fail, success } from "../../../utils/apiResponse";
import { getValidatedBody } from "../../../middlewares/validate.middleware";
import type { PatchVariantBody } from "./productManagement.types";
import { parsePatchVariant } from "./productManagement.validation";
import { productManagementService } from "./productManagement.service";

export const variantController = {
  async update(req: Request, res: Response): Promise<void> {
    const variantId = Number(req.params.variantId);
    if (!Number.isInteger(variantId) || variantId < 1) throw fail("Invalid variantId", 400);
    const body = getValidatedBody<PatchVariantBody>(req);
    const data = await productManagementService.updateVariant(variantId, body);
    res.json(success(data));
  },

  async remove(req: Request, res: Response): Promise<void> {
    const variantId = Number(req.params.variantId);
    if (!Number.isInteger(variantId) || variantId < 1) throw fail("Invalid variantId", 400);
    const data = await productManagementService.deleteVariant(variantId);
    res.json(success(data));
  }
};
