import { planRepository } from "../plans/plan.repository";
import { productRepository } from "../products/product.repository";
import { cartRepository } from "./cart.repository";
import type { AddCartItemBody } from "./cart.types";
import { fail } from "../../utils/apiResponse";

export const cartService = {
  async getCart(userId: number) {
    const cartId = await cartRepository.getActiveCartId(userId);
    if (!cartId) {
      return { cart_id: null as number | null, items: [] as Awaited<ReturnType<typeof cartRepository.listItemsWithDetails>> };
    }
    const items = await cartRepository.listItemsWithDetails(cartId);
    return { cart_id: cartId, items };
  },

  async count(userId: number): Promise<number> {
    const cartId = await cartRepository.getActiveCartId(userId);
    if (!cartId) return 0;
    return cartRepository.sumQuantityForCart(cartId);
  },

  async addItem(userId: number, body: AddCartItemBody) {
    const product = await productRepository.findActiveById(body.productId);
    if (!product) throw fail("Product not found", 404);

    const hasPlan = await productRepository.productHasPlan(body.productId, body.planId);
    if (!hasPlan) throw fail("Plan is not available for this product", 400);

    const plan = await planRepository.findActiveById(body.planId);
    if (!plan) throw fail("Plan not found", 404);

    let extra = 0;
    if (body.variantId != null) {
      const v = await productRepository.findActiveVariantForProduct(body.variantId, body.productId);
      if (!v) throw fail("Variant not found for this product", 400);
      extra = Number(v.extra_price);
    }

    const unitPrice = Number(plan.price) + extra;
    if (!Number.isFinite(unitPrice) || unitPrice < 0) throw fail("Invalid price", 400);

    const cartId = await cartRepository.getOrCreateActiveCartId(userId);
    const variantId = body.variantId ?? null;
    const existing = await cartRepository.findLine(cartId, body.productId, body.planId, variantId);

    if (existing) {
      const newQty = existing.quantity + body.quantity;
      await cartRepository.updateLineQuantity(existing.cart_item_id, newQty, unitPrice);
      return { cart_item_id: existing.cart_item_id, merged: true as const };
    }

    const totalPrice = unitPrice * body.quantity;
    const cartItemId = await cartRepository.insertItem(
      cartId,
      body.productId,
      body.planId,
      variantId,
      body.quantity,
      unitPrice,
      totalPrice
    );
    return { cart_item_id: cartItemId, merged: false as const };
  },

  async updateQuantity(userId: number, cartItemId: number, quantity: number) {
    const ok = await cartRepository.itemBelongsToUser(cartItemId, userId);
    if (!ok) throw fail("Cart item not found", 404);

    const line = await cartRepository.getLineForPricing(cartItemId, userId);
    if (!line) throw fail("Cart item not found", 404);

    const unitPrice = Number(line.unit_price);
    await cartRepository.updateLineQuantity(cartItemId, quantity, unitPrice);
  },

  async removeItem(userId: number, cartItemId: number) {
    const ok = await cartRepository.itemBelongsToUser(cartItemId, userId);
    if (!ok) throw fail("Cart item not found", 404);
    const deleted = await cartRepository.deleteLine(cartItemId);
    if (!deleted) throw fail("Cart item not found", 404);
  }
};
