import { Router } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { validateBody } from "../../../middlewares/validate.middleware";
import { requireInternalStaffSync } from "../../../middlewares/role.middleware";
import { parsePatchSubscriptionItem } from "./subscriptionItem.validation";
import { subscriptionItemController } from "./subscriptionItem.controller";

const router = Router();

router.use(requireInternalStaffSync);

router.patch(
  "/:subscriptionItemId",
  validateBody(parsePatchSubscriptionItem),
  asyncHandler(subscriptionItemController.update.bind(subscriptionItemController))
);
router.delete(
  "/:subscriptionItemId",
  asyncHandler(subscriptionItemController.remove.bind(subscriptionItemController))
);

export default router;
