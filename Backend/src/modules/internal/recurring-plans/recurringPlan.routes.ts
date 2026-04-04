import { Router } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { validateBody } from "../../../middlewares/validate.middleware";
import { requireInternalStaffSync } from "../../../middlewares/role.middleware";
import { parseCreatePlan, parsePatchPlan } from "./recurringPlan.validation";
import { recurringPlanController } from "./recurringPlan.controller";

const router = Router();

router.use(requireInternalStaffSync);

router.get("/", asyncHandler(recurringPlanController.list.bind(recurringPlanController)));
router.post(
  "/",
  validateBody(parseCreatePlan),
  asyncHandler(recurringPlanController.create.bind(recurringPlanController))
);
router.get("/:planId", asyncHandler(recurringPlanController.get.bind(recurringPlanController)));
router.patch(
  "/:planId",
  validateBody(parsePatchPlan),
  asyncHandler(recurringPlanController.update.bind(recurringPlanController))
);
router.delete("/:planId", asyncHandler(recurringPlanController.remove.bind(recurringPlanController)));

export default router;
