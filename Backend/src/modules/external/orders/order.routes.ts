import { Router } from "express";
import { requireUser } from "../../../middlewares/auth.middleware";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { validateBody } from "../../../middlewares/validate.middleware";
import { parseOrderPayment } from "./order.validation";
import { orderController } from "./order.controller";

const router = Router();

router.use(requireUser);

router.get("/", asyncHandler(orderController.list.bind(orderController)));
router.get("/:orderNumber/invoices", asyncHandler(orderController.invoicesForOrder.bind(orderController)));
router.get("/:orderNumber/download", asyncHandler(orderController.download.bind(orderController)));
router.post("/:orderNumber/renew", asyncHandler(orderController.renew.bind(orderController)));
router.post("/:orderNumber/close", asyncHandler(orderController.close.bind(orderController)));
router.post(
  "/:orderNumber/payment",
  validateBody(parseOrderPayment),
  asyncHandler(orderController.pay.bind(orderController))
);
router.get("/:orderNumber", asyncHandler(orderController.detail.bind(orderController)));

export default router;
