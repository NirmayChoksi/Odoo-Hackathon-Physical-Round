import { Router } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { validateBody } from "../../../middlewares/validate.middleware";
import { requireInternalStaffSync } from "../../../middlewares/role.middleware";
import {
  parseCreateTemplate,
  parseCreateTemplateItem,
  parsePatchTemplate,
  parsePatchTemplateItem
} from "./quotationTemplate.validation";
import { quotationTemplateController } from "./quotationTemplate.controller";

const router = Router();

router.use(requireInternalStaffSync);

router.get("/", asyncHandler(quotationTemplateController.list.bind(quotationTemplateController)));
router.post(
  "/",
  validateBody(parseCreateTemplate),
  asyncHandler(quotationTemplateController.create.bind(quotationTemplateController))
);

router.post(
  "/:templateId/items",
  validateBody(parseCreateTemplateItem),
  asyncHandler(quotationTemplateController.addItem.bind(quotationTemplateController))
);

router.patch(
  "/:templateId/items/:itemId",
  validateBody(parsePatchTemplateItem),
  asyncHandler(quotationTemplateController.updateTemplateItem.bind(quotationTemplateController))
);
router.delete(
  "/:templateId/items/:itemId",
  asyncHandler(quotationTemplateController.deleteTemplateItem.bind(quotationTemplateController))
);

router.get("/:templateId", asyncHandler(quotationTemplateController.get.bind(quotationTemplateController)));
router.patch(
  "/:templateId",
  validateBody(parsePatchTemplate),
  asyncHandler(quotationTemplateController.update.bind(quotationTemplateController))
);
router.delete("/:templateId", asyncHandler(quotationTemplateController.remove.bind(quotationTemplateController)));

export default router;
