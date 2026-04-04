import type { Request } from "express";
import { z } from "zod";
import { optionalSearch, optionalUpperEnum, zodQueryParse, zQueryLimit, zQueryPage } from "../../../utils/zodSql";
import type {
  AttachPlanBody,
  CreateProductBody,
  CreateVariantBody,
  PatchProductBody,
  PatchVariantBody,
  ProductListQuery
} from "./productManagement.types";

function num(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

const productListQuerySchema = z.object({
  page: zQueryPage(1),
  limit: zQueryLimit(20),
  search: optionalSearch(500),
  status: optionalUpperEnum(["ACTIVE", "INACTIVE"]),
});

export function parseProductListQuery(
  req: Request
): { ok: true; value: ProductListQuery } | { ok: false; errors: string[] } {
  return zodQueryParse(productListQuerySchema, req.query);
}

export function parseCreateProduct(
  req: Request
): { ok: true; value: CreateProductBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const productName = b.productName != null ? String(b.productName).trim() : "";
  const productType = b.productType != null ? String(b.productType).trim() : "";
  const salesPrice = num(b.salesPrice);
  const errors: string[] = [];
  if (!productName) errors.push("productName is required");
  if (!productType) errors.push("productType is required");
  if (salesPrice === undefined || salesPrice < 0) errors.push("salesPrice is required and must be >= 0");
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      productName,
      productType,
      salesPrice: salesPrice!,
      costPrice: num(b.costPrice),
      description: b.description != null ? String(b.description) : undefined,
      imageUrl: b.imageUrl != null ? String(b.imageUrl).trim() : undefined,
      shortDescription: b.shortDescription != null ? String(b.shortDescription).trim() : undefined,
      termsAndConditions: b.termsAndConditions != null ? String(b.termsAndConditions) : undefined,
      isRecurring: b.isRecurring !== undefined ? Boolean(b.isRecurring) : undefined,
      status: b.status != null ? String(b.status).toUpperCase() : undefined
    }
  };
}

export function parsePatchProduct(
  req: Request
): { ok: true; value: PatchProductBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const out: PatchProductBody = {};
  if (b.productName !== undefined) out.productName = String(b.productName).trim();
  if (b.productType !== undefined) out.productType = String(b.productType).trim();
  if (b.salesPrice !== undefined) {
    const n = num(b.salesPrice);
    if (n === undefined || n < 0) return { ok: false, errors: ["salesPrice invalid"] };
    out.salesPrice = n;
  }
  if (b.costPrice !== undefined) {
    const n = num(b.costPrice);
    if (n === undefined || n < 0) return { ok: false, errors: ["costPrice invalid"] };
    out.costPrice = n;
  }
  if (b.description !== undefined) out.description = String(b.description);
  if (b.imageUrl !== undefined) out.imageUrl = String(b.imageUrl).trim();
  if (b.shortDescription !== undefined) out.shortDescription = String(b.shortDescription).trim();
  if (b.termsAndConditions !== undefined) out.termsAndConditions = String(b.termsAndConditions);
  if (b.isRecurring !== undefined) out.isRecurring = Boolean(b.isRecurring);
  if (b.status !== undefined) out.status = String(b.status).toUpperCase();
  if (Object.keys(out).length === 0) return { ok: false, errors: ["At least one field is required"] };
  return { ok: true, value: out };
}

export function parseCreateVariant(
  req: Request
): { ok: true; value: CreateVariantBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const attributeName = b.attributeName != null ? String(b.attributeName).trim() : "";
  const attributeValue = b.attributeValue != null ? String(b.attributeValue).trim() : "";
  if (!attributeName) return { ok: false, errors: ["attributeName is required"] };
  if (!attributeValue) return { ok: false, errors: ["attributeValue is required"] };
  const extraPrice = num(b.extraPrice) ?? 0;
  return {
    ok: true,
    value: {
      attributeName,
      attributeValue,
      extraPrice,
      status: b.status != null ? String(b.status).toUpperCase() : undefined
    }
  };
}

export function parsePatchVariant(
  req: Request
): { ok: true; value: PatchVariantBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const out: PatchVariantBody = {};
  if (b.attributeName !== undefined) out.attributeName = String(b.attributeName).trim();
  if (b.attributeValue !== undefined) out.attributeValue = String(b.attributeValue).trim();
  if (b.extraPrice !== undefined) {
    const n = num(b.extraPrice);
    if (n === undefined || n < 0) return { ok: false, errors: ["extraPrice invalid"] };
    out.extraPrice = n;
  }
  if (b.status !== undefined) out.status = String(b.status).toUpperCase();
  if (Object.keys(out).length === 0) return { ok: false, errors: ["At least one field is required"] };
  return { ok: true, value: out };
}

export function parseAttachPlan(
  req: Request
): { ok: true; value: AttachPlanBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const planId = num(b.planId);
  if (planId === undefined || !Number.isInteger(planId) || planId < 1) {
    return { ok: false, errors: ["planId is required"] };
  }
  return {
    ok: true,
    value: {
      planId,
      isDefault: b.isDefault !== undefined ? Boolean(b.isDefault) : false,
      status: b.status != null ? String(b.status).toUpperCase() : undefined
    }
  };
}
