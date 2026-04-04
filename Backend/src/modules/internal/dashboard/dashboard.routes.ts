import { Router } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { requireInternalStaffSync } from "../../../middlewares/role.middleware";
import { dashboardController } from "./dashboard.controller";

const router = Router();

router.use(requireInternalStaffSync);

router.get("/summary", asyncHandler(dashboardController.summary.bind(dashboardController)));
router.get("/charts", asyncHandler(dashboardController.charts.bind(dashboardController)));

export default router;
