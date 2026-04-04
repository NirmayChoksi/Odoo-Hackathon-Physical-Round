import type { Request, Response } from "express";
import { fail, success } from "../../../utils/apiResponse";
import { getValidatedBody } from "../../../middlewares/validate.middleware";
import type { AddCartItemBody, ApplyDiscountBody, UpdateCartItemBody } from "./cart.types";
import { cartService } from "./cart.service";

export const cartController = {
  async getCart(req: Request, res: Response): Promise<void> {
    const data = await cartService.getCart(req.userId!);
    res.json(success(data));
  },

  async add(req: Request, res: Response): Promise<void> {
    const body = getValidatedBody<AddCartItemBody>(req);
    const result = await cartService.addItem(req.userId!, body);
    res.status(201).json(success(result));
  },

  async updateItem(req: Request, res: Response): Promise<void> {
    const cartItemId = Number(req.params.cartItemId);
    if (!Number.isInteger(cartItemId) || cartItemId < 1) {
      throw fail("Invalid cartItemId", 400);
    }
    const body = getValidatedBody<UpdateCartItemBody>(req);
    await cartService.updateItem(req.userId!, cartItemId, body);
    res.json(success({ cart_item_id: cartItemId, updated: true }));
  },

  async removeItem(req: Request, res: Response): Promise<void> {
    const cartItemId = Number(req.params.cartItemId);
    if (!Number.isInteger(cartItemId) || cartItemId < 1) {
      throw fail("Invalid cartItemId", 400);
    }
    await cartService.removeItem(req.userId!, cartItemId);
    res.json(success({ removed: true, cart_item_id: cartItemId }));
  },

  async applyDiscount(req: Request, res: Response): Promise<void> {
    const body = getValidatedBody<ApplyDiscountBody>(req);
    const r = await cartService.applyDiscount(req.userId!, body.code);
    res.json(success(r));
  },

  async removeDiscount(req: Request, res: Response): Promise<void> {
    await cartService.removeDiscount(req.userId!);
    res.json(success({ removed: true }));
  },

  async count(req: Request, res: Response): Promise<void> {
    const n = await cartService.count(req.userId!);
    res.json(success({ count: n }));
  }
};
