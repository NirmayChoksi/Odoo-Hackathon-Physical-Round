import type { Request } from "express";
import { z } from "zod";
import { optionalPositiveIntQuery, optionalSearch, optionalUpperEnum, zodQueryParse, zQueryLimit, zQueryPage } from "../../../utils/zodSql";
import type {
  CreateSubscriptionBody,
  CreateSubscriptionItemBody,
  PatchSubscriptionBody,
  PatchSubscriptionItemBody,
  PatchSubscriptionStatusBody,
  SubscriptionListQuery
} from "./subscription.types";

const SUBSCRIPTION_STATUSES = ["DRAFT", "QUOTATION", "CONFIRMED", "ACTIVE", "CLOSED"] as const;
const STATUSES: ReadonlySet<string> = new Set(SUBSCRIPTION_STATUSES);

function num(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

const subscriptionListQuerySchema = z.object({
  page: zQueryPage(1),
  limit: zQueryLimit(10),
  search: optionalSearch(500),
  status: optionalUpperEnum(SUBSCRIPTION_STATUSES),
  customerId: optionalPositiveIntQuery,
});

export function parseSubscriptionListQuery(
  req: Request
): { ok: true; value: SubscriptionListQuery } | { ok: false; errors: string[] } {
  return zodQueryParse(subscriptionListQuerySchema, req.query);
}

export function parseCreateSubscription(
  req: Request
): { ok: true; value: CreateSubscriptionBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const customerId = num(b.customerId);
  const planId = num(b.planId);
  if (customerId === undefined || !Number.isInteger(customerId) || customerId < 1) {
    return { ok: false, errors: ["customerId is required"] };
  }
  if (planId === undefined || !Number.isInteger(planId) || planId < 1) {
    return { ok: false, errors: ["planId is required"] };
  }
  let templateId: number | null | undefined = undefined;
  if (b.templateId === null) templateId = null;
  else if (b.templateId !== undefined) {
    const t = num(b.templateId);
    if (t === undefined || !Number.isInteger(t) || t < 1) return { ok: false, errors: ["templateId invalid"] };
    templateId = t;
  }
  const status = b.status != null ? String(b.status).trim().toUpperCase() : undefined;
  if (status && !STATUSES.has(status)) return { ok: false, errors: ["Invalid status"] };
  return {
    ok: true,
    value: {
      customerId,
      planId,
      templateId,
      status,
      startDate: b.startDate != null ? String(b.startDate) : undefined
    }
  };
}

export function parsePatchSubscription(
  req: Request
): { ok: true; value: PatchSubscriptionBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const out: PatchSubscriptionBody = {};
  if (b.planId !== undefined) {
    const p = num(b.planId);
    if (p === undefined || !Number.isInteger(p) || p < 1) return { ok: false, errors: ["planId invalid"] };
    out.planId = p;
  }
  if (b.templateId !== undefined) {
    if (b.templateId === null) out.templateId = null;
    else {
      const t = num(b.templateId);
      if (t === undefined || !Number.isInteger(t) || t < 1) return { ok: false, errors: ["templateId invalid"] };
      out.templateId = t;
    }
  }
  if (b.expirationDate !== undefined) out.expirationDate = b.expirationDate === null ? null : String(b.expirationDate);
  if (b.paymentTerms !== undefined) out.paymentTerms = b.paymentTerms === null ? null : String(b.paymentTerms);
  if (Object.keys(out).length === 0) return { ok: false, errors: ["At least one field is required"] };
  return { ok: true, value: out };
}

export function parsePatchSubscriptionStatus(
  req: Request
): { ok: true; value: PatchSubscriptionStatusBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const status = b.status != null ? String(b.status).trim().toUpperCase() : "";
  if (!STATUSES.has(status)) return { ok: false, errors: ["status is required and must be valid"] };
  return { ok: true, value: { status } };
}

export function parseCreateSubscriptionItem(
  req: Request
): { ok: true; value: CreateSubscriptionItemBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const productId = num(b.productId);
  const quantity = num(b.quantity);
  const unitPrice = num(b.unitPrice);
  if (productId === undefined || !Number.isInteger(productId) || productId < 1) {
    return { ok: false, errors: ["productId is required"] };
  }
  if (quantity === undefined || !Number.isInteger(quantity) || quantity < 1) {
    return { ok: false, errors: ["quantity is required"] };
  }
  if (unitPrice === undefined || unitPrice < 0) return { ok: false, errors: ["unitPrice is required"] };
  let variantId: number | null | undefined = undefined;
  if (b.variantId === null) variantId = null;
  else if (b.variantId !== undefined) {
    const v = num(b.variantId);
    if (v === undefined || !Number.isInteger(v) || v < 1) return { ok: false, errors: ["variantId invalid"] };
    variantId = v;
  }
  return {
    ok: true,
    value: {
      productId,
      variantId,
      quantity: quantity!,
      unitPrice: unitPrice!,
      taxId: b.taxId === null ? null : num(b.taxId),
      discountId: b.discountId === null ? null : num(b.discountId)
    }
  };
}

export function parsePatchSubscriptionItem(
  req: Request
): { ok: true; value: PatchSubscriptionItemBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const out: PatchSubscriptionItemBody = {};
  if (b.productId !== undefined) {
    const p = num(b.productId);
    if (p === undefined || !Number.isInteger(p) || p < 1) return { ok: false, errors: ["productId invalid"] };
    out.productId = p;
  }
  if (b.variantId !== undefined) {
    if (b.variantId === null) out.variantId = null;
    else {
      const v = num(b.variantId);
      if (v === undefined || !Number.isInteger(v) || v < 1) return { ok: false, errors: ["variantId invalid"] };
      out.variantId = v;
    }
  }
  if (b.quantity !== undefined) {
    const q = num(b.quantity);
    if (q === undefined || !Number.isInteger(q) || q < 1) return { ok: false, errors: ["quantity invalid"] };
    out.quantity = q;
  }
  if (b.unitPrice !== undefined) {
    const u = num(b.unitPrice);
    if (u === undefined || u < 0) return { ok: false, errors: ["unitPrice invalid"] };
    out.unitPrice = u;
  }
  if (b.taxId !== undefined) out.taxId = b.taxId === null ? null : num(b.taxId);
  if (b.discountId !== undefined) out.discountId = b.discountId === null ? null : num(b.discountId);
  if (Object.keys(out).length === 0) return { ok: false, errors: ["At least one field is required"] };
  return { ok: true, value: out };
}
