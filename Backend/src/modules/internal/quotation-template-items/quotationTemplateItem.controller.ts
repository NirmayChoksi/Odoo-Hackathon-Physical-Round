import type { Request, Response } from "express";
import { fail, success } from "../../../utils/apiResponse";
import { getValidatedBody } from "../../../middlewares/validate.middleware";
import type { PatchTemplateItemBody } from "../quotation-templates/quotationTemplate.types";
import { parsePatchTemplateItem } from "../quotation-templates/quotationTemplate.validation";
import { quotationTemplateService } from "../quotation-templates/quotationTemplate.service";

export const quotationTemplateItemController = {
  async update(req: Request, res: Response): Promise<void> {
    const templateItemId = Number(req.params.templateItemId);
    if (!Number.isInteger(templateItemId) || templateItemId < 1) throw fail("Invalid templateItemId", 400);
    const body = getValidatedBody<PatchTemplateItemBody>(req);
    const data = await quotationTemplateService.updateItem(templateItemId, body);
    res.json(success(data));
  },

  async remove(req: Request, res: Response): Promise<void> {
    const templateItemId = Number(req.params.templateItemId);
    if (!Number.isInteger(templateItemId) || templateItemId < 1) throw fail("Invalid templateItemId", 400);
    const data = await quotationTemplateService.deleteItem(templateItemId);
    res.json(success(data));
  }
};
