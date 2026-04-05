import type { Request, Response } from "express";
import { success } from "../../../utils/apiResponse";
import { getValidatedBody } from "../../../middlewares/validate.middleware";
import { fail } from "../../../utils/apiResponse";
import type { PlaceOrderBody, SavePaymentBody, SelectAddressBody } from "./checkout.types";
import type { SaveAddressBody } from "../profile/profile.types";
import { checkoutService } from "./checkout.service";

export const checkoutController = {
  async summary(req: Request, res: Response): Promise<void> {
    const data = await checkoutService.summary(req.userId!);
    res.json(success(data));
  },

  async listAddresses(req: Request, res: Response): Promise<void> {
    const rows = await checkoutService.listAddresses(req.userId!);
    res.json(success({ addresses: rows }));
  },

  async saveAddress(req: Request, res: Response): Promise<void> {
    const body = getValidatedBody<SaveAddressBody>(req);
    const r = await checkoutService.saveAddress(req.userId!, body);
    res.status(201).json(success(r));
  },

  async patchAddress(req: Request, res: Response): Promise<void> {
    const addressId = Number(req.params.addressId);
    if (!Number.isInteger(addressId) || addressId < 1) {
      throw fail("Invalid addressId", 400);
    }
    const body = getValidatedBody<Partial<SaveAddressBody> & { isDefault?: boolean }>(req);
    const r = await checkoutService.updateAddress(req.userId!, addressId, body);
    res.json(success(r));
  },

  async selectAddress(req: Request, res: Response): Promise<void> {
    const body = getValidatedBody<SelectAddressBody>(req);
    const r = await checkoutService.selectAddress(req.userId!, body.addressId);
    res.json(success(r));
  },

  async savePayment(req: Request, res: Response): Promise<void> {
    const body = getValidatedBody<SavePaymentBody>(req);
    const r = await checkoutService.savePayment(req.userId!, body);
    res.json(success(r));
  },

  async placeOrder(req: Request, res: Response): Promise<void> {
    const body = getValidatedBody<PlaceOrderBody>(req);
    const r = await checkoutService.placeOrder(req.userId!, body);
    res.status(201).json(success(r));
  }
};
