import { Router } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { validateBody } from "../../../middlewares/validate.middleware";
import { requireInternalStaffSync } from "../../../middlewares/role.middleware";
import { parseCreateInternalInvoice } from "./internalInvoice.validation";
import { internalInvoiceController } from "./internalInvoice.controller";

const router = Router();

router.use(requireInternalStaffSync);

router.get("/", asyncHandler(internalInvoiceController.list.bind(internalInvoiceController)));
router.post(
  "/",
  validateBody(parseCreateInternalInvoice),
  asyncHandler(internalInvoiceController.create.bind(internalInvoiceController))
);

router.get(
  "/:invoiceId/print",
  asyncHandler(internalInvoiceController.print.bind(internalInvoiceController))
);
router.post(
  "/:invoiceId/confirm",
  asyncHandler(internalInvoiceController.confirm.bind(internalInvoiceController))
);
router.post(
  "/:invoiceId/cancel",
  asyncHandler(internalInvoiceController.cancel.bind(internalInvoiceController))
);
router.post(
  "/:invoiceId/send",
  asyncHandler(internalInvoiceController.send.bind(internalInvoiceController))
);

router.get("/:invoiceId", asyncHandler(internalInvoiceController.get.bind(internalInvoiceController)));

export default router;
