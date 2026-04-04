import type { Request } from "express";
import { clampLimit, clampPage } from "../../../utils/pagination";
import type { OrderListQuery } from "./order.types";

export function parseOrderListQuery(req: Request): { ok: true; value: OrderListQuery } | { ok: false; errors: string[] } {
  const q = req.query as Record<string, unknown>;
  const page = clampPage(Number(q.page) || 1);
  const limit = clampLimit(Number(q.limit) || 10);
  const status =
    q.status != null && String(q.status).trim() !== "" ? String(q.status).trim().toUpperCase() : undefined;
  const allowed = new Set(["DRAFT", "QUOTATION", "CONFIRMED", "ACTIVE", "CLOSED"]);
  if (status && !allowed.has(status)) {
    return { ok: false, errors: ["Invalid status filter"] };
  }
  return { ok: true, value: { page, limit, status } };
}

export function parseOrderPayment(req: Request): { ok: true; value: { paymentMethod: string } } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const pm = b.paymentMethod;
  if (typeof pm !== "string" || !pm.trim()) {
    return { ok: false, errors: ["paymentMethod is required"] };
  }
  return { ok: true, value: { paymentMethod: pm.trim() } };
}
