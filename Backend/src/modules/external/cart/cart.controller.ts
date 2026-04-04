import type { Request, Response } from "express";
import { fail, success } from "../../utils/apiResponse";
import { getValidatedBody } from "../../middlewares/validate.middleware";
import type { AddCartItemBody, UpdateCartItemBody } from "./cart.types";
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
    await cartService.updateQuantity(req.userId!, cartItemId, body.quantity);
    res.json(success({ cart_item_id: cartItemId, quantity: body.quantity }));
  },

  async removeItem(req: Request, res: Response): Promise<void> {
    const cartItemId = Number(req.params.cartItemId);
    if (!Number.isInteger(cartItemId) || cartItemId < 1) {
      throw fail("Invalid cartItemId", 400);
    }
    await cartService.removeItem(req.userId!, cartItemId);
    res.json(success({ removed: true, cart_item_id: cartItemId }));
  },

  async count(req: Request, res: Response): Promise<void> {
    const n = await cartService.count(req.userId!);
    res.json(success({ count: n }));
  }
};
