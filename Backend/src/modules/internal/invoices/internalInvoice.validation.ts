import type { Request } from "express";
import { z } from "zod";
import { optionalPositiveIntQuery, optionalUpperEnum, zodQueryParse, zQueryLimit, zQueryPage } from "../../../utils/zodSql";
import type { CreateInternalInvoiceBody, InternalInvoiceListQuery } from "./internalInvoice.types";

function num(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

const internalInvoiceListQuerySchema = z.object({
  page: zQueryPage(1),
  limit: zQueryLimit(20),
  status: optionalUpperEnum(["DRAFT", "CONFIRMED", "PAID", "CANCELLED"]),
  customerId: optionalPositiveIntQuery,
});

export function parseInternalInvoiceListQuery(
  req: Request
): { ok: true; value: InternalInvoiceListQuery } | { ok: false; errors: string[] } {
  return zodQueryParse(internalInvoiceListQuerySchema, req.query);
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
