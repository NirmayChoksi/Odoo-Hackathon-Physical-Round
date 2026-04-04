import { cartRepository } from "../cart/cart.repository";
import { cartService } from "../cart/cart.service";
import { profileRepository } from "../profile/profile.repository";
import { fail } from "../../../utils/apiResponse";
import { checkoutRepository } from "./checkout.repository";
import type { PlaceOrderBody, SavePaymentBody } from "./checkout.types";
import type { SaveAddressBody } from "../profile/profile.types";

export const checkoutService = {
  async summary(userId: number) {
    return cartService.getCart(userId);
  },

  async listAddresses(userId: number) {
    return profileRepository.listAddresses(userId);
  },

  async saveAddress(userId: number, body: SaveAddressBody) {
    const id = await profileRepository.insertAddress(userId, body);
    return { address_id: id };
  },

  async updateAddress(userId: number, addressId: number, body: Partial<SaveAddressBody> & { isDefault?: boolean }) {
    const ok = await profileRepository.updateAddress(userId, addressId, body);
    if (!ok) throw fail("Address not found", 404);
    return { address_id: addressId, updated: true };
  },

  async selectAddress(userId: number, addressId: number) {
    const addr = await profileRepository.getAddressForUser(addressId, userId);
    if (!addr) throw fail("Address not found", 404);
    const cartId = await cartRepository.getOrCreateActiveCartId(userId);
    await cartRepository.setSelectedAddress(cartId, addressId);
    return { address_id: addressId, selected: true };
  },

  async savePayment(userId: number, body: SavePaymentBody) {
    const cartId = await cartRepository.getOrCreateActiveCartId(userId);
    await cartRepository.setPaymentMethod(cartId, body.paymentMethod);
    return { payment_method: body.paymentMethod };
  },

  async placeOrder(userId: number, body: PlaceOrderBody) {
    await cartService.getCart(userId);
    const cartId = await cartRepository.getActiveCartId(userId);
    if (!cartId) throw fail("Cart not found", 400);

    const meta = await cartRepository.getCartMeta(cartId);
    const addressId = body.addressId ?? meta?.selected_address_id ?? undefined;
    if (!addressId) {
      throw fail("addressId is required (or use POST /select-address first)", 400);
    }

    const addr = await profileRepository.getAddressForUser(addressId, userId);
    if (!addr) throw fail("Address not found", 404);

    const payMethod = body.paymentMethod?.trim() || meta?.payment_method?.trim();
    if (!payMethod) throw fail("paymentMethod is required on cart or in request body", 400);

    try {
      return await checkoutRepository.placeOrderTransaction(userId, cartId, addressId, payMethod);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === "ADDRESS_NOT_FOUND") throw fail("Address not found", 404);
      if (msg === "CART_NOT_FOUND") throw fail("Cart not found", 400);
      if (msg === "CART_EMPTY") throw fail("Cart is empty", 400);
      if (msg === "User not found") throw fail("User not found", 404);
      throw e;
    }
  }
};
