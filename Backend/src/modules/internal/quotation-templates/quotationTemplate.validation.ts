import type { Request } from "express";
import { z } from "zod";
import { optionalSearch, optionalUpperEnum, zodQueryParse, zQueryLimit, zQueryPage } from "../../../utils/zodSql";
import type {
  CreateTemplateBody,
  CreateTemplateItemBody,
  PatchTemplateBody,
  PatchTemplateItemBody,
  TemplateListQuery
} from "./quotationTemplate.types";

function num(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

const templateListQuerySchema = z.object({
  page: zQueryPage(1),
  limit: zQueryLimit(20),
  search: optionalSearch(500),
  status: optionalUpperEnum(["ACTIVE", "INACTIVE"]),
});

export function parseTemplateListQuery(
  req: Request
): { ok: true; value: TemplateListQuery } | { ok: false; errors: string[] } {
  return zodQueryParse(templateListQuerySchema, req.query);
}

export function parseCreateTemplate(
  req: Request
): { ok: true; value: CreateTemplateBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const templateName = b.templateName != null ? String(b.templateName).trim() : "";
  if (!templateName) return { ok: false, errors: ["templateName is required"] };
  let planId: number | null | undefined = undefined;
  if (b.planId === null) planId = null;
  else if (b.planId !== undefined) {
    const p = num(b.planId);
    if (p === undefined || !Number.isInteger(p) || p < 1) return { ok: false, errors: ["planId invalid"] };
    planId = p;
  }
  return {
    ok: true,
    value: {
      templateName,
      validityDays: num(b.validityDays) ?? 30,
      planId,
      description: b.description != null ? String(b.description) : undefined,
      status: b.status != null ? String(b.status).toUpperCase() : undefined
    }
  };
}

export function parsePatchTemplate(
  req: Request
): { ok: true; value: PatchTemplateBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const out: PatchTemplateBody = {};
  if (b.templateName !== undefined) out.templateName = String(b.templateName).trim();
  if (b.validityDays !== undefined) out.validityDays = num(b.validityDays);
  if (b.planId !== undefined) {
    if (b.planId === null) out.planId = null;
    else {
      const p = num(b.planId);
      if (p === undefined || !Number.isInteger(p) || p < 1) return { ok: false, errors: ["planId invalid"] };
      out.planId = p;
    }
  }
  if (b.description !== undefined) out.description = String(b.description);
  if (b.status !== undefined) out.status = String(b.status).toUpperCase();
  if (Object.keys(out).length === 0) return { ok: false, errors: ["At least one field is required"] };
  return { ok: true, value: out };
}

export function parseCreateTemplateItem(
  req: Request
): { ok: true; value: CreateTemplateItemBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const productId = num(b.productId);
  const unitPrice = num(b.unitPrice);
  if (productId === undefined || !Number.isInteger(productId) || productId < 1) {
    return { ok: false, errors: ["productId is required"] };
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
      quantity: num(b.quantity) ?? 1,
      unitPrice: unitPrice!,
      taxId: b.taxId === null ? null : num(b.taxId)
    }
  };
}

export function parsePatchTemplateItem(
  req: Request
): { ok: true; value: PatchTemplateItemBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const out: PatchTemplateItemBody = {};
  if (b.productId !== undefined) {
    const n = num(b.productId);
    if (n === undefined || !Number.isInteger(n) || n < 1) return { ok: false, errors: ["productId invalid"] };
    out.productId = n;
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
  if (Object.keys(out).length === 0) return { ok: false, errors: ["At least one field is required"] };
  return { ok: true, value: out };
}
