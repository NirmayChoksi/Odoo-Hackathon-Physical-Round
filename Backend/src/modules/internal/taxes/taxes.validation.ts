import type { Request } from "express";
import { num, str } from "../../../utils/validation";
import type { CreateTaxBody, PatchTaxBody, TaxListQuery } from "./taxes.types";

export function parseTaxListQuery(req: Request): { ok: true; value: TaxListQuery } | { ok: false; errors: string[] } {
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

export function parseCreateTax(req: Request): { ok: true; value: CreateTaxBody } | { ok: false; errors: string[] } {
  const b = req.body;
  const taxName = str(b.taxName);
  const taxType = str(b.taxType);
  if (!taxName) return { ok: false, errors: ["taxName is required"] };
  if (!taxType || !["PERCENTAGE", "FIXED"].includes(taxType)) return { ok: false, errors: ["Invalid taxType"] };

  return {
    ok: true,
    value: {
      taxName,
      taxType: taxType as "PERCENTAGE" | "FIXED",
      taxPercentage: num(b.taxPercentage) || 0,
      status: (str(b.status) as any) || "ACTIVE"
    }
  };
}

export function parsePatchTax(req: Request): { ok: true; value: PatchTaxBody } | { ok: false; errors: string[] } {
  const b = req.body;
  const out: PatchTaxBody = {};
  if (b.taxName !== undefined) out.taxName = str(b.taxName);
  if (b.taxType !== undefined) out.taxType = str(b.taxType) as any;
  if (b.taxPercentage !== undefined) out.taxPercentage = num(b.taxPercentage);
  if (b.status !== undefined) out.status = str(b.status) as any;

  if (Object.keys(out).length === 0) return { ok: false, errors: ["At least one field is required"] };
  return { ok: true, value: out };
}
