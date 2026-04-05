import { discountRepository } from "../../discounts/discount.repository";
import { planRepository } from "../../plans/plan.repository";
import { productRepository } from "../../products/product.repository";
import { taxRepository } from "../../taxes/tax.repository";
import { fail } from "../../../utils/apiResponse";
import { allocateDiscountToLines, lineSubtotal, lineTax, roundMoney } from "../../../utils/priceCalculator";
import { calculateCartDiscount } from "../../utils/discountCalculator";
import { cartRepository } from "./cart.repository";
import type { AddCartItemBody, UpdateCartItemBody } from "./cart.types";

async function recalculateCart(cartId: number): Promise<void> {
  const meta = await cartRepository.getCartMeta(cartId);
  if (!meta) return;

  const lines = await cartRepository.listItemsRaw(cartId);
  if (lines.length === 0) return;

  const taxPct = await taxRepository.getDefaultTaxPercent();

  let discountRow = null as Awaited<ReturnType<typeof discountRepository.findById>>;
  if (meta.applied_discount_id) {
    discountRow = await discountRepository.findById(meta.applied_discount_id);
    if (!discountRow || discountRow.status !== "ACTIVE") {
      await cartRepository.setAppliedDiscount(cartId, null);
      discountRow = null;
    }
  }

  const subs = lines.map((l) =>
    lineSubtotal(Number(l.unit_price), Number(l.extra_price), l.quantity)
  );
  const cartSubtotal = roundMoney(subs.reduce((a, b) => a + b, 0));
  const totalQty = lines.reduce((s, l) => s + l.quantity, 0);

  let cartDiscountTotal = 0;
  if (discountRow) {
    const minP = Number(discountRow.minimum_purchase);
    const minQ = discountRow.minimum_quantity;
    if (cartSubtotal >= minP && totalQty >= minQ) {
      cartDiscountTotal = calculateCartDiscount(cartSubtotal, {
        discount_type: discountRow.discount_type,
        discount_value: Number(discountRow.discount_value)
      });
    }
  }

  const alloc = allocateDiscountToLines(
    subs.map((subtotal) => ({ subtotal })),
    cartDiscountTotal
  );

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const sub = subs[i];
    const lineDisc = alloc[i] ?? 0;
    const tax = lineTax(sub, taxPct);
    const total = roundMoney(sub + tax - lineDisc);
    await cartRepository.updateLinePricing(l.cart_item_id, {
      product_id: l.product_id,
      plan_id: l.plan_id,
      variant_id: l.variant_id,
      quantity: l.quantity,
      unit_price: Number(l.unit_price),
      extra_price: Number(l.extra_price),
      tax_amount: tax,
      discount_amount: lineDisc,
      total_price: total
    });
  }
}

function summarizeItems(items: Awaited<ReturnType<typeof cartRepository.listItemsWithDetails>>) {
  const subtotal = roundMoney(
    items.reduce((s, i) => s + (Number(i.unit_price) + Number(i.extra_price)) * i.quantity, 0)
  );
  const tax_amount = roundMoney(items.reduce((s, i) => s + Number(i.tax_amount), 0));
  const discount_amount = roundMoney(items.reduce((s, i) => s + Number(i.discount_amount), 0));
  const total = roundMoney(items.reduce((s, i) => s + Number(i.total_price), 0));
  return { subtotal, tax_amount, discount_amount, total };
}

export const cartService = {
  async getCart(userId: number) {
    const cartId = await cartRepository.getActiveCartId(userId);
    if (!cartId) {
      return {
        cart_id: null as number | null,
        items: [],
        summary: { subtotal: 0, tax_amount: 0, discount_amount: 0, total: 0 },
        payment_method: null as string | null
      };
    }
    await recalculateCart(cartId);
    const meta = await cartRepository.getCartMeta(cartId);
    const items = await cartRepository.listItemsWithDetails(cartId);
    const summary = summarizeItems(items);
    return {
      cart_id: cartId,
      items,
      summary,
      payment_method: meta?.payment_method ?? null
    };
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
    if (!hasPlan) throw fail("Plan is not available for this product", 404);

    const plan = await planRepository.findActiveById(body.planId);
    if (!plan) throw fail("Plan not found", 404);

    let extra = 0;
    if (body.variantId != null) {
      const v = await productRepository.findActiveVariantForProduct(body.variantId, body.productId);
      if (!v) throw fail("Variant not found for this product", 400);
      extra = Number(v.extra_price);
    }

    const unitPrice = Number(plan.price);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) throw fail("Invalid price", 400);

    const cartId = await cartRepository.getOrCreateActiveCartId(userId);
    const variantId = body.variantId ?? null;
    const existing = await cartRepository.findLine(cartId, body.productId, body.planId, variantId);

    if (existing) {
      const row = await cartRepository.getItemFull(existing.cart_item_id, userId);
      if (!row) throw fail("Cart item not found", 404);
      await cartRepository.updateLinePricing(existing.cart_item_id, {
        product_id: body.productId,
        plan_id: body.planId,
        variant_id: variantId,
        quantity: existing.quantity + body.quantity,
        unit_price: unitPrice,
        extra_price: extra,
        tax_amount: 0,
        discount_amount: 0,
        total_price: 0
      });
      await recalculateCart(cartId);
      return { cart_item_id: existing.cart_item_id, merged: true as const };
    }

    await cartRepository.insertItem(
      cartId,
      body.productId,
      body.planId,
      variantId,
      body.quantity,
      unitPrice,
      extra,
      0,
      0,
      0
    );
    await recalculateCart(cartId);
    const line = await cartRepository.findLine(cartId, body.productId, body.planId, variantId);
    return { cart_item_id: line!.cart_item_id, merged: false as const };
  },

  async updateItem(userId: number, cartItemId: number, body: UpdateCartItemBody) {
    const row = await cartRepository.getItemFull(cartItemId, userId);
    if (!row) throw fail("Cart item not found", 404);

    const productId = row.product_id;
    const planId = body.planId ?? row.plan_id;
    const variantId = body.variantId !== undefined ? body.variantId : row.variant_id;

    const hasPlan = await productRepository.productHasPlan(productId, planId);
    if (!hasPlan) throw fail("Plan is not available for this product", 400);

    const plan = await planRepository.findActiveById(planId);
    if (!plan) throw fail("Plan not found", 404);

    let extra = 0;
    if (variantId != null) {
      const v = await productRepository.findActiveVariantForProduct(variantId, productId);
      if (!v) throw fail("Variant not found for this product", 400);
      extra = Number(v.extra_price);
    }

    await cartRepository.updateLinePricing(cartItemId, {
      product_id: productId,
      plan_id: planId,
      variant_id: variantId,
      quantity: body.quantity,
      unit_price: Number(plan.price),
      extra_price: extra,
      tax_amount: 0,
      discount_amount: 0,
      total_price: 0
    });

    const cartId = row.cart_id;
    await recalculateCart(cartId);
  },

  async applyDiscount(userId: number, code: string) {
    const cartId = await cartRepository.getOrCreateActiveCartId(userId);
    const disc = await discountRepository.findActiveByCouponCode(code);
    if (!disc) throw fail("Invalid or expired discount code", 400);
    await cartRepository.setAppliedDiscount(cartId, disc.discount_id);
    await recalculateCart(cartId);
    return { discount_id: disc.discount_id, discount_name: disc.discount_name };
  },

  async removeDiscount(userId: number) {
    const cartId = await cartRepository.getActiveCartId(userId);
    if (!cartId) return;
    await cartRepository.setAppliedDiscount(cartId, null);
    await recalculateCart(cartId);
  },

  async removeItem(userId: number, cartItemId: number) {
    const ok = await cartRepository.itemBelongsToUser(cartItemId, userId);
    if (!ok) throw fail("Cart item not found", 404);
    const row = await cartRepository.getItemFull(cartItemId, userId);
    const deleted = await cartRepository.deleteLine(cartItemId);
    if (!deleted) throw fail("Cart item not found", 404);
    if (row) await recalculateCart(row.cart_id);
  }
};
