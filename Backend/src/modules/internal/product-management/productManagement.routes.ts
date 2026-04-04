import { Router } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { validateBody } from "../../../middlewares/validate.middleware";
import { requireInternalStaffSync } from "../../../middlewares/role.middleware";
import {
  parseAttachPlan,
  parseCreateProduct,
  parseCreateVariant,
  parsePatchProduct
} from "./productManagement.validation";
import { productManagementController } from "./productManagement.controller";

const router = Router();

router.use(requireInternalStaffSync);

router.get("/", asyncHandler(productManagementController.list.bind(productManagementController)));
router.post(
  "/",
  validateBody(parseCreateProduct),
  asyncHandler(productManagementController.create.bind(productManagementController))
);

router.get(
  "/:productId/variants",
  asyncHandler(productManagementController.listVariants.bind(productManagementController))
);
router.post(
  "/:productId/variants",
  validateBody(parseCreateVariant),
  asyncHandler(productManagementController.createVariant.bind(productManagementController))
);
router.post(
  "/:productId/plans",
  validateBody(parseAttachPlan),
  asyncHandler(productManagementController.attachPlan.bind(productManagementController))
);

router.get("/:productId", asyncHandler(productManagementController.get.bind(productManagementController)));
router.patch(
  "/:productId",
  validateBody(parsePatchProduct),
  asyncHandler(productManagementController.update.bind(productManagementController))
);
router.delete("/:productId", asyncHandler(productManagementController.remove.bind(productManagementController)));

export default router;
