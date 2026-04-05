import { Router } from "express";
import { requireUser } from "../../../middlewares/auth.middleware";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { validateBody } from "../../../middlewares/validate.middleware";
import {
  parsePatchAddress,
  parsePlaceOrder,
  parseSaveAddress,
  parseSavePayment,
  parseSelectAddress
} from "./checkout.validation";
import { checkoutController } from "./checkout.controller";

const router = Router();

router.use(requireUser);

router.get("/summary", asyncHandler(checkoutController.summary.bind(checkoutController)));
router.get("/addresses", asyncHandler(checkoutController.listAddresses.bind(checkoutController)));
router.post(
  "/addresses",
  validateBody(parseSaveAddress),
  asyncHandler(checkoutController.saveAddress.bind(checkoutController))
);
router.patch(
  "/addresses/:addressId",
  validateBody(parsePatchAddress),
  asyncHandler(checkoutController.patchAddress.bind(checkoutController))
);
router.post(
  "/select-address",
  validateBody(parseSelectAddress),
  asyncHandler(checkoutController.selectAddress.bind(checkoutController))
);
router.post(
  "/payment-method",
  validateBody(parseSavePayment),
  asyncHandler(checkoutController.savePayment.bind(checkoutController))
);
router.post(
  "/place-order",
  validateBody(parsePlaceOrder),
  asyncHandler(checkoutController.placeOrder.bind(checkoutController))
);

export default router;
