import type { Request } from "express";
import { num, str } from "../../../utils/validation";
import type { CreateTaxBody, PatchTaxBody, TaxListQuery } from "./taxes.types";

export function parseTaxListQuery(req: Request): { ok: true; value: TaxListQuery } | { ok: false; errors: string[] } {
  const q = req.query;
  const forSelection =
    q.forSelection === "1" ||
    q.forSelection === "true" ||
    String(q.forSelection ?? "").toLowerCase() === "true" ||
    str(q.scope)?.toLowerCase() === "subscription";
  let status = str(q.status) as TaxListQuery["status"];
  if (forSelection) {
    status = "ACTIVE";
  }
  return {
    ok: true,
    value: {
      page: num(q.page) || 1,
      limit: num(q.limit) || 10,
      search: str(q.search),
      status
    }
  };
}

export function parseCreateTax(req: Request): { ok: true; value: CreateTaxBody } | { ok: false; errors: string[] } {
  const b = req.body && typeof req.body === "object" ? req.body : {};
  const taxName = str(b.taxName);
  const typeRaw = str(b.taxType)?.toUpperCase();
  if (!taxName) return { ok: false, errors: ["taxName is required"] };
  if (!typeRaw || !["PERCENTAGE", "FIXED"].includes(typeRaw)) return { ok: false, errors: ["Invalid taxType"] };

  const desc = str(b.description);
  return {
    ok: true,
    value: {
      taxName,
      taxType: typeRaw as "PERCENTAGE" | "FIXED",
      taxPercentage: num(b.taxPercentage) || 0,
      ...(desc ? { description: desc } : {}),
      status: (str(b.status) as any) || "ACTIVE"
    }
  };
}

export function parsePatchTax(req: Request): { ok: true; value: PatchTaxBody } | { ok: false; errors: string[] } {
  const b = req.body && typeof req.body === "object" ? req.body : {};
  const out: PatchTaxBody = {};
  if (b.taxName !== undefined) out.taxName = str(b.taxName);
  if (b.taxType !== undefined) {
    const u = str(b.taxType)?.toUpperCase();
    if (!u || !["PERCENTAGE", "FIXED"].includes(u)) return { ok: false, errors: ["Invalid taxType"] };
    out.taxType = u as "PERCENTAGE" | "FIXED";
  }
  if (b.taxPercentage !== undefined) out.taxPercentage = num(b.taxPercentage);
  if (b.description !== undefined) out.description = str(b.description) || null;
  if (b.status !== undefined) out.status = str(b.status) as any;

  if (Object.keys(out).length === 0) return { ok: false, errors: ["At least one field is required"] };
  return { ok: true, value: out };
}
