import type { Request } from "express";
import type { AddCartItemBody, UpdateCartItemBody } from "./cart.types";

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
  const quantity = num(b.quantity);
  if (quantity === undefined || !Number.isInteger(quantity) || quantity < 1) {
    return { ok: false, errors: ["quantity must be a positive integer"] };
  }
  return { ok: true, value: { quantity } };
}
