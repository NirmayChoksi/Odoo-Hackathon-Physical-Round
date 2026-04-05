import { Router } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { validateBody } from "../../../middlewares/validate.middleware";
import { requireInternalStaffSync } from "../../../middlewares/role.middleware";
import {
  parseCreateSubscription,
  parseCreateSubscriptionItem,
  parsePatchSubscription,
  parsePatchSubscriptionStatus
} from "./subscription.validation";
import { subscriptionController } from "./subscription.controller";

const router = Router();

router.use(requireInternalStaffSync);

router.get("/next-number", asyncHandler(subscriptionController.nextNumber.bind(subscriptionController)));
router.get("/", asyncHandler(subscriptionController.list.bind(subscriptionController)));
router.post(
  "/",
  validateBody(parseCreateSubscription),
  asyncHandler(subscriptionController.create.bind(subscriptionController))
);

router.get(
  "/:subscriptionId/items",
  asyncHandler(subscriptionController.listItems.bind(subscriptionController))
);
router.post(
  "/:subscriptionId/items",
  validateBody(parseCreateSubscriptionItem),
  asyncHandler(subscriptionController.addItem.bind(subscriptionController))
);

router.patch(
  "/:subscriptionId/status",
  validateBody(parsePatchSubscriptionStatus),
  asyncHandler(subscriptionController.patchStatus.bind(subscriptionController))
);
router.post("/:subscriptionId/renew", asyncHandler(subscriptionController.renew.bind(subscriptionController)));
router.post("/:subscriptionId/close", asyncHandler(subscriptionController.close.bind(subscriptionController)));
router.post(
  "/:subscriptionId/invoice",
  asyncHandler(subscriptionController.generateInvoice.bind(subscriptionController))
);

router.get("/:subscriptionId", asyncHandler(subscriptionController.get.bind(subscriptionController)));
router.patch(
  "/:subscriptionId",
  validateBody(parsePatchSubscription),
  asyncHandler(subscriptionController.update.bind(subscriptionController))
);

export default router;
