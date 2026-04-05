import { Router } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { validateBody } from "../../../middlewares/validate.middleware";
import { requireInternalStaffSync } from "../../../middlewares/role.middleware";
import { parseCreateContact, parsePatchContact } from "./contact.validation";
import { contactController } from "./contact.controller";

const router = Router();

router.use(requireInternalStaffSync);

router.get("/", asyncHandler(contactController.list.bind(contactController)));
router.get("/:contactId", asyncHandler(contactController.getOne.bind(contactController)));
router.post("/", validateBody(parseCreateContact), asyncHandler(contactController.create.bind(contactController)));
router.patch("/:contactId", validateBody(parsePatchContact), asyncHandler(contactController.update.bind(contactController)));
router.delete("/:contactId", asyncHandler(contactController.remove.bind(contactController)));

export default router;
