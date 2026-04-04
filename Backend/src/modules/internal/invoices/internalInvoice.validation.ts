import type { Request } from "express";
import { clampLimit, clampPage } from "../../../utils/pagination";
import type { CreateInternalInvoiceBody, InternalInvoiceListQuery } from "./internalInvoice.types";

function num(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function parseInternalInvoiceListQuery(
  req: Request
): { ok: true; value: InternalInvoiceListQuery } | { ok: false; errors: string[] } {
  const q = req.query as Record<string, unknown>;
  const page = clampPage(Number(q.page) || 1);
  const limit = clampLimit(Number(q.limit) || 20);
  const status = q.status != null ? String(q.status).trim().toUpperCase() : undefined;
  const allowed = new Set(["DRAFT", "CONFIRMED", "PAID", "CANCELLED"]);
  if (status && !allowed.has(status)) return { ok: false, errors: ["Invalid status"] };
  const customerId = num(q.customerId);
  if (q.customerId !== undefined && customerId !== undefined && (!Number.isInteger(customerId) || customerId < 1)) {
    return { ok: false, errors: ["customerId invalid"] };
  }
  return {
    ok: true,
    value: {
      page,
      limit,
      status,
      customerId: customerId !== undefined && Number.isInteger(customerId) ? customerId : undefined
    }
  };
}

export function parseCreateInternalInvoice(
  req: Request
): { ok: true; value: CreateInternalInvoiceBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const subscriptionId = num(b.subscriptionId);
  if (subscriptionId === undefined || !Number.isInteger(subscriptionId) || subscriptionId < 1) {
    return { ok: false, errors: ["subscriptionId is required"] };
  }
  return { ok: true, value: { subscriptionId } };
}
