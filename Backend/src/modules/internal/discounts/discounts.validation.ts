import type { Request } from "express";
import { num, str, date } from "../../../utils/validation";
import type { CreateDiscountBody, DiscountListQuery, PatchDiscountBody } from "./discounts.types";

export function parseDiscountListQuery(req: Request): { ok: true; value: DiscountListQuery } | { ok: false; errors: string[] } {
  const q = req.query;
  return {
    ok: true,
    value: {
      page: num(q.page) || 1,
      limit: num(q.limit) || 10,
      search: str(q.search),
      status: str(q.status) as any
    }
  };
}

export function parseCreateDiscount(req: Request): { ok: true; value: CreateDiscountBody } | { ok: false; errors: string[] } {
  const b = req.body;
  const name = str(b.discountName);
  if (!name) return { ok: false, errors: ["discountName is required"] };

  const typeRaw = str(b.discountType)?.toUpperCase();
  const discountType: CreateDiscountBody["discountType"] =
    typeRaw === "FIXED" || typeRaw === "PERCENTAGE" ? typeRaw : "PERCENTAGE";

  const couponRaw = str(b.couponCode);
  /** Empty string must not be stored — UNIQUE(coupon_code) rejects duplicate "". */
  const couponCode = couponRaw && couponRaw.length > 0 ? couponRaw : undefined;

  const minPur = num(b.minPurchaseAmount ?? b.minimumPurchase);
  const minQty = num(b.minQuantity ?? b.minimumQuantity);

  const lim = b.limitUsage;
  const limitUsage =
    lim === null || lim === undefined || lim === ""
      ? undefined
      : num(lim);

  return {
    ok: true,
    value: {
      discountName: name,
      discountType,
      discountValue: num(b.discountValue) ?? 0,
      minimumPurchase: minPur ?? 0,
      minimumQuantity: minQty ?? 1,
      couponCode,
      startDate: date(b.startDate),
      endDate: date(b.endDate),
      limitUsage,
      status: (str(b.status)?.toUpperCase() as CreateDiscountBody["status"]) || "ACTIVE"
    }
  };
}

export function parsePatchDiscount(req: Request): { ok: true; value: PatchDiscountBody } | { ok: false; errors: string[] } {
  const b = req.body;
  const out: PatchDiscountBody = {};
  if (b.discountName !== undefined) out.discountName = str(b.discountName);
  if (b.discountType !== undefined) {
    const t = str(b.discountType)?.toUpperCase();
    if (t === "FIXED" || t === "PERCENTAGE") out.discountType = t;
  }
  if (b.discountValue !== undefined) out.discountValue = num(b.discountValue);
  if (b.minPurchaseAmount !== undefined || b.minimumPurchase !== undefined) {
    out.minimumPurchase = num(b.minPurchaseAmount ?? b.minimumPurchase);
  }
  if (b.minQuantity !== undefined || b.minimumQuantity !== undefined) {
    out.minimumQuantity = num(b.minQuantity ?? b.minimumQuantity);
  }
  if (b.couponCode !== undefined) {
    const c = str(b.couponCode);
    out.couponCode = c && c.length > 0 ? c : null;
  }
  if (b.startDate !== undefined) out.startDate = date(b.startDate);
  if (b.endDate !== undefined) out.endDate = date(b.endDate);
  if (b.limitUsage !== undefined) {
    out.limitUsage = b.limitUsage === null || b.limitUsage === "" ? null : num(b.limitUsage) ?? null;
  }
  if (b.status !== undefined) out.status = str(b.status)?.toUpperCase() as PatchDiscountBody["status"];

  if (Object.keys(out).length === 0) return { ok: false, errors: ["At least one field is required"] };
  return { ok: true, value: out };
}
