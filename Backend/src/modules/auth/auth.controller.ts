import type { Request, Response } from "express";
import { success } from "../../utils/apiResponse";
import { getValidatedBody } from "../../middlewares/validate.middleware";
import { authService } from "./auth.service";
import type { SignupBody, LoginBody, ResetPasswordBody, VerifyResetBody } from "./auth.types";

export const authController = {
  async signup(req: Request, res: Response): Promise<void> {
    const body = getValidatedBody<SignupBody>(req);
    const result = await authService.signup(body);
    res.status(201).json(success(result));
  },

  async login(req: Request, res: Response): Promise<void> {
    const body = getValidatedBody<LoginBody>(req);
    const result = await authService.login(body);
    res.status(200).json(success(result));
  },

  async resetPassword(req: Request, res: Response): Promise<void> {
    const body = getValidatedBody<ResetPasswordBody>(req);
    const result = await authService.resetPassword(body);
    res.status(200).json(success(result));
  },

  async verifyReset(req: Request, res: Response): Promise<void> {
    const body = getValidatedBody<VerifyResetBody>(req);
    const result = await authService.verifyReset(body);
    res.status(200).json(success(result));
  }
};
