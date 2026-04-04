import { Router } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { validateBody } from "../../../middlewares/validate.middleware";
import { requireInternalStaffSync } from "../../../middlewares/role.middleware";
import { parsePatchContact } from "./contact.validation";
import { contactController } from "./contact.controller";

const router = Router();

router.use(requireInternalStaffSync);

router.patch("/:contactId", validateBody(parsePatchContact), asyncHandler(contactController.update.bind(contactController)));
router.delete("/:contactId", asyncHandler(contactController.remove.bind(contactController)));

export default router;
