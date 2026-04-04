import { Router } from "express";
import { requireUser } from "../../../middlewares/auth.middleware";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { validateBody } from "../../../middlewares/validate.middleware";
import { parseInvoicePayment } from "./invoice.validation";
import { invoiceController } from "./invoice.controller";

const router = Router();

router.use(requireUser);

router.get("/:invoiceNumber/download", asyncHandler(invoiceController.download.bind(invoiceController)));
router.post(
  "/:invoiceNumber/payment",
  validateBody(parseInvoicePayment),
  asyncHandler(invoiceController.pay.bind(invoiceController))
);
router.get("/:invoiceNumber", asyncHandler(invoiceController.detail.bind(invoiceController)));

export default router;
