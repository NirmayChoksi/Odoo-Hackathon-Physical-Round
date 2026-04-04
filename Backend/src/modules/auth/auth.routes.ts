import { Router } from "express";
import { asyncHandler } from "../../middlewares/error.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import { parseSignup, parseLogin, parseResetPassword, parseVerifyReset } from "./auth.validation";
import { authController } from "./auth.controller";

const router = Router();

router.post("/signup", validateBody(parseSignup), asyncHandler(authController.signup.bind(authController)));
router.post("/login", validateBody(parseLogin), asyncHandler(authController.login.bind(authController)));
router.post("/reset-password", validateBody(parseResetPassword), asyncHandler(authController.resetPassword.bind(authController)));
router.post("/verify-reset", validateBody(parseVerifyReset), asyncHandler(authController.verifyReset.bind(authController)));

export default router;
