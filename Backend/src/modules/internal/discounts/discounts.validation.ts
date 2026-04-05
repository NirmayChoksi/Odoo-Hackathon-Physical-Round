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

  return {
    ok: true,
    value: {
      discountName: name,
      discountType: (str(b.discountType) as any) || "PERCENTAGE",
      discountValue: num(b.discountValue) || 0,
      minPurchaseAmount: num(b.minPurchaseAmount) || 0,
      minQuantity: num(b.minQuantity) || 0,
      couponCode: str(b.couponCode),
      startDate: date(b.startDate),
      endDate: date(b.endDate),
      limitUsage: num(b.limitUsage) || null,
      status: (str(b.status) as any) || "ACTIVE"
    }
  };
}

export function parsePatchDiscount(req: Request): { ok: true; value: PatchDiscountBody } | { ok: false; errors: string[] } {
  const b = req.body;
  const out: PatchDiscountBody = {};
  if (b.discountName !== undefined) out.discountName = str(b.discountName);
  if (b.discountType !== undefined) out.discountType = str(b.discountType) as any;
  if (b.discountValue !== undefined) out.discountValue = num(b.discountValue);
  if (b.minPurchaseAmount !== undefined) out.minPurchaseAmount = num(b.minPurchaseAmount);
  if (b.minQuantity !== undefined) out.minQuantity = num(b.minQuantity);
  if (b.couponCode !== undefined) out.couponCode = str(b.couponCode);
  if (b.startDate !== undefined) out.startDate = date(b.startDate);
  if (b.endDate !== undefined) out.endDate = date(b.endDate);
  if (b.limitUsage !== undefined) out.limitUsage = num(b.limitUsage);
  if (b.status !== undefined) out.status = str(b.status) as any;

  if (Object.keys(out).length === 0) return { ok: false, errors: ["At least one field is required"] };
  return { ok: true, value: out };
}
