import { Router } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { validateBody } from "../../../middlewares/validate.middleware";
import { requireInternalStaffSync } from "../../../middlewares/role.middleware";
import { parsePatchVariant } from "./productManagement.validation";
import { variantController } from "./variant.controller";

const router = Router();

router.use(requireInternalStaffSync);

router.patch(
  "/:variantId",
  validateBody(parsePatchVariant),
  asyncHandler(variantController.update.bind(variantController))
);
router.delete("/:variantId", asyncHandler(variantController.remove.bind(variantController)));

export default router;
