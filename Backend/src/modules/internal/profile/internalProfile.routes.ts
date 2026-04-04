import { Router } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { validateBody } from "../../../middlewares/validate.middleware";
import { requireInternalStaffSync } from "../../../middlewares/role.middleware";
import { parseUpdateProfile } from "../../external/profile/profile.validation";
import { internalProfileController } from "./internalProfile.controller";

const router = Router();

router.use(requireInternalStaffSync);

router.get("/", asyncHandler(internalProfileController.get.bind(internalProfileController)));
router.patch(
  "/",
  validateBody(parseUpdateProfile),
  asyncHandler(internalProfileController.update.bind(internalProfileController))
);

export default router;
