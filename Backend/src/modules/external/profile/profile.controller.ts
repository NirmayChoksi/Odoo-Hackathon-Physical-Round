import type { Request, Response } from "express";
import { fail, success } from "../../../utils/apiResponse";
import { getValidatedBody } from "../../../middlewares/validate.middleware";
import type { SaveAddressBody, UpdateProfileBody } from "./profile.types";
import { profileService } from "./profile.service";

export const profileController = {
  async getProfile(req: Request, res: Response): Promise<void> {
    const data = await profileService.getProfile(req.userId!);
    res.json(success(data));
  },

  async updateProfile(req: Request, res: Response): Promise<void> {
    const body = getValidatedBody<UpdateProfileBody>(req);
    const data = await profileService.updateProfile(req.userId!, body);
    res.json(success(data));
  },

  async listAddresses(req: Request, res: Response): Promise<void> {
    const data = await profileService.listAddresses(req.userId!);
    res.json(success(data));
  },

  async addAddress(req: Request, res: Response): Promise<void> {
    const body = getValidatedBody<SaveAddressBody>(req);
    const data = await profileService.addAddress(req.userId!, body);
    res.status(201).json(success(data));
  },

  async updateAddress(req: Request, res: Response): Promise<void> {
    const addressId = Number(req.params.addressId);
    if (!Number.isInteger(addressId) || addressId < 1) {
      throw fail("Invalid addressId", 400);
    }
    const body = getValidatedBody<Partial<SaveAddressBody> & { isDefault?: boolean }>(req);
    const data = await profileService.updateAddress(req.userId!, addressId, body);
    res.json(success(data));
  },

  async deleteAddress(req: Request, res: Response): Promise<void> {
    const addressId = Number(req.params.addressId);
    if (!Number.isInteger(addressId) || addressId < 1) {
      throw fail("Invalid addressId", 400);
    }
    const data = await profileService.deleteAddress(req.userId!, addressId);
    res.json(success(data));
  },

  async setDefaultAddress(req: Request, res: Response): Promise<void> {
    const addressId = Number(req.params.addressId);
    if (!Number.isInteger(addressId) || addressId < 1) {
      throw fail("Invalid addressId", 400);
    }
    const data = await profileService.setDefaultAddress(req.userId!, addressId);
    res.json(success(data));
  }
};
