import { Router } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { validateBody } from "../../../middlewares/validate.middleware";
import { requireInternalStaffSync } from "../../../middlewares/role.middleware";
import { parseCreateUser, parsePatchUser } from "./user.validation";
import { userController } from "./user.controller";

const router = Router();

router.use(requireInternalStaffSync);

router.get("/", asyncHandler(userController.list.bind(userController)));
router.get("/:userId", asyncHandler(userController.getOne.bind(userController)));
router.post("/", validateBody(parseCreateUser), asyncHandler(userController.create.bind(userController)));
router.patch("/:userId", validateBody(parsePatchUser), asyncHandler(userController.update.bind(userController)));
router.delete("/:userId", asyncHandler(userController.remove.bind(userController)));

export default router;
