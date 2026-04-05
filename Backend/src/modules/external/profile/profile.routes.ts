import { Router } from "express";
import { requireUser } from "../../../middlewares/auth.middleware";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { validateBody } from "../../../middlewares/validate.middleware";
import { parsePatchAddress, parseSaveAddress, parseUpdateProfile } from "./profile.validation";
import { profileController } from "./profile.controller";

const router = Router();

router.use(requireUser);

router.get("/", asyncHandler(profileController.getProfile.bind(profileController)));
router.patch("/", validateBody(parseUpdateProfile), asyncHandler(profileController.updateProfile.bind(profileController)));

router.get("/addresses", asyncHandler(profileController.listAddresses.bind(profileController)));
router.post("/addresses", validateBody(parseSaveAddress), asyncHandler(profileController.addAddress.bind(profileController)));
router.patch(
  "/addresses/:addressId",
  validateBody(parsePatchAddress),
  asyncHandler(profileController.updateAddress.bind(profileController))
);
router.delete("/addresses/:addressId", asyncHandler(profileController.deleteAddress.bind(profileController)));
router.post(
  "/addresses/:addressId/default",
  asyncHandler(profileController.setDefaultAddress.bind(profileController))
);

export default router;
