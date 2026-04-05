import { Router } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { validateBody } from "../../../middlewares/validate.middleware";
import { requireInternalStaffSync } from "../../../middlewares/role.middleware";
import { parsePatchAddress, parseSaveAddress, parseUpdateProfile } from "../../external/profile/profile.validation";
import { profileController } from "../../external/profile/profile.controller";
import { internalProfileController } from "./internalProfile.controller";

const router = Router();

router.use(requireInternalStaffSync);

router.get("/", asyncHandler(internalProfileController.get.bind(internalProfileController)));
router.patch(
  "/",
  validateBody(parseUpdateProfile),
  asyncHandler(internalProfileController.update.bind(internalProfileController))
);

/** Same user_addresses flows as `/api/external/profile` (Account Settings under internal dashboard). */
router.get("/addresses", asyncHandler(profileController.listAddresses.bind(profileController)));
router.post(
  "/addresses",
  validateBody(parseSaveAddress),
  asyncHandler(profileController.addAddress.bind(profileController)),
);
router.patch(
  "/addresses/:addressId",
  validateBody(parsePatchAddress),
  asyncHandler(profileController.updateAddress.bind(profileController)),
);
router.delete("/addresses/:addressId", asyncHandler(profileController.deleteAddress.bind(profileController)));
router.post(
  "/addresses/:addressId/default",
  asyncHandler(profileController.setDefaultAddress.bind(profileController)),
);

export default router;
