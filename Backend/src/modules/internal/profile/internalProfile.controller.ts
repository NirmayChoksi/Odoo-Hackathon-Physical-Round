import type { Request, Response } from "express";
import { success } from "../../../utils/apiResponse";
import { getValidatedBody } from "../../../middlewares/validate.middleware";
import type { UpdateProfileBody } from "../../external/profile/profile.types";
import { profileService } from "../../external/profile/profile.service";

/** Staff profile: same `users` row as portal; guarded by `requireInternalStaffSync`. */
export const internalProfileController = {
  async get(req: Request, res: Response): Promise<void> {
    const data = await profileService.getProfile(req.userId!);
    res.json(success(data));
  },

  async update(req: Request, res: Response): Promise<void> {
    const body = getValidatedBody<UpdateProfileBody>(req);
    const data = await profileService.updateProfile(req.userId!, body);
    res.json(success(data));
  }
};
