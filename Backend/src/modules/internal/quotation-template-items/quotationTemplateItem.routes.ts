import { Router } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { validateBody } from "../../../middlewares/validate.middleware";
import { requireInternalStaffSync } from "../../../middlewares/role.middleware";
import { parsePatchTemplateItem } from "./quotationTemplateItem.validation";
import { quotationTemplateItemController } from "./quotationTemplateItem.controller";

const router = Router();

router.use(requireInternalStaffSync);

router.patch(
  "/:templateItemId",
  validateBody(parsePatchTemplateItem),
  asyncHandler(quotationTemplateItemController.update.bind(quotationTemplateItemController))
);
router.delete(
  "/:templateItemId",
  asyncHandler(quotationTemplateItemController.remove.bind(quotationTemplateItemController))
);

export default router;
