import type { Request } from "express";
import type { AddCartItemBody, ApplyDiscountBody, UpdateCartItemBody } from "./cart.types";

function num(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function parseAddCartItem(req: Request): { ok: true; value: AddCartItemBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const errors: string[] = [];
  const productId = num(b.productId);
  const planId = num(b.planId);
  const quantity = num(b.quantity) ?? 1;
  let variantId: number | null | undefined = num(b.variantId);
  if (b.variantId === null) variantId = null;
  if (productId === undefined || !Number.isInteger(productId) || productId < 1) errors.push("productId is required");
  if (planId === undefined || !Number.isInteger(planId) || planId < 1) errors.push("planId is required");
  if (!Number.isInteger(quantity) || quantity < 1) errors.push("quantity must be a positive integer");
  if (variantId !== undefined && variantId !== null && (!Number.isInteger(variantId) || variantId < 1)) {
    errors.push("variantId must be a positive integer or null");
  }
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      productId: productId!,
      planId: planId!,
      variantId: variantId === undefined ? null : variantId,
      quantity
    }
  };
}

export function parseUpdateCartItem(req: Request): { ok: true; value: UpdateCartItemBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const errors: string[] = [];
  const quantity = num(b.quantity);
  if (quantity === undefined || !Number.isInteger(quantity) || quantity < 1) {
    errors.push("quantity must be a positive integer");
  }
  const planId = num(b.planId);
  if (b.planId !== undefined && planId !== undefined && (!Number.isInteger(planId) || planId < 1)) {
    errors.push("planId must be a positive integer");
  }
  let variantId: number | null | undefined = undefined;
  if (b.variantId !== undefined) {
    if (b.variantId === null) variantId = null;
    else {
      const v = num(b.variantId);
      if (v === undefined || !Number.isInteger(v) || v < 1) errors.push("variantId must be positive or null");
      else variantId = v;
    }
  }
  if (errors.length) return { ok: false, errors };
  const out: UpdateCartItemBody = { quantity: quantity! };
  if (planId !== undefined) out.planId = planId;
  if (variantId !== undefined) out.variantId = variantId;
  return { ok: true, value: out };
}

export function parseApplyDiscount(req: Request): { ok: true; value: ApplyDiscountBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const raw = b.code ?? b.discountCode;
  if (typeof raw !== "string" || !raw.trim()) {
    return { ok: false, errors: ["code is required"] };
  }
  return { ok: true, value: { code: raw.trim() } };
}
