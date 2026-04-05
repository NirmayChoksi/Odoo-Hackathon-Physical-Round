import { Router } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { validateBody } from "../../../middlewares/validate.middleware";
import { requireInternalStaffSync } from "../../../middlewares/role.middleware";
import { parseRecordPayment } from "./payment.validation";
import { paymentController } from "./payment.controller";

const router = Router();

router.use(requireInternalStaffSync);

router.get(
  "/outstanding-invoices",
  asyncHandler(paymentController.outstanding.bind(paymentController))
);
router.get("/summary", asyncHandler(paymentController.summary.bind(paymentController)));

router.get("/", asyncHandler(paymentController.list.bind(paymentController)));
router.post(
  "/",
  validateBody(parseRecordPayment),
  asyncHandler(paymentController.record.bind(paymentController))
);
router.get("/:paymentId", asyncHandler(paymentController.get.bind(paymentController)));

export default router;
