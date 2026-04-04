import { Router } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { requireInternalStaffSync } from "../../../middlewares/role.middleware";
import { reportController } from "./report.controller";

const router = Router();

router.use(requireInternalStaffSync);

router.get("/page", asyncHandler(reportController.page.bind(reportController)));
router.get("/meta", asyncHandler(reportController.meta.bind(reportController)));
router.get("/summary", asyncHandler(reportController.summary.bind(reportController)));
router.get(
  "/active-subscriptions",
  asyncHandler(reportController.activeSubscriptions.bind(reportController))
);
router.get("/revenue", asyncHandler(reportController.revenue.bind(reportController)));
router.get("/payments", asyncHandler(reportController.payments.bind(reportController)));
router.get(
  "/overdue-invoices",
  asyncHandler(reportController.overdueInvoices.bind(reportController))
);
router.get("/export", asyncHandler(reportController.export.bind(reportController)));

export default router;
