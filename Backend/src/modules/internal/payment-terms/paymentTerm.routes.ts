import { Router } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { validateBody } from "../../../middlewares/validate.middleware";
import { requireInternalStaffSync } from "../../../middlewares/role.middleware";
import { paymentTermController } from "./paymentTerm.controller";
import {
  parseAddInstallment,
  parseAddMethod,
  parseCreatePaymentTerm,
  parsePatchInstallment,
  parsePatchPaymentTerm,
} from "./paymentTerm.validation";

const router = Router();

router.use(requireInternalStaffSync);

router.patch(
  "/installments/:installmentId",
  validateBody(parsePatchInstallment),
  asyncHandler(paymentTermController.patchInstallment.bind(paymentTermController))
);
router.delete(
  "/installments/:installmentId",
  asyncHandler(paymentTermController.deleteInstallment.bind(paymentTermController))
);
router.delete(
  "/methods/:paymentTermMethodId",
  asyncHandler(paymentTermController.deleteMethod.bind(paymentTermController))
);

router.get("/", asyncHandler(paymentTermController.list.bind(paymentTermController)));
router.post(
  "/",
  validateBody(parseCreatePaymentTerm),
  asyncHandler(paymentTermController.create.bind(paymentTermController))
);

router.post(
  "/:paymentTermId/installments",
  validateBody(parseAddInstallment),
  asyncHandler(paymentTermController.addInstallment.bind(paymentTermController))
);
router.post(
  "/:paymentTermId/methods",
  validateBody(parseAddMethod),
  asyncHandler(paymentTermController.addMethod.bind(paymentTermController))
);

router.get("/:paymentTermId", asyncHandler(paymentTermController.get.bind(paymentTermController)));
router.patch(
  "/:paymentTermId",
  validateBody(parsePatchPaymentTerm),
  asyncHandler(paymentTermController.update.bind(paymentTermController))
);
router.delete("/:paymentTermId", asyncHandler(paymentTermController.remove.bind(paymentTermController)));

export default router;
