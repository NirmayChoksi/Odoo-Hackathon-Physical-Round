import type { Request } from "express";
import { z } from "zod";
import { optionalUpperEnum, zodQueryParse, zQueryLimit, zQueryPage } from "../../../utils/zodSql";
import type { OrderListQuery } from "./order.types";

const ORDER_STATUSES = ["DRAFT", "QUOTATION", "CONFIRMED", "ACTIVE", "CLOSED"] as const;

const orderListQuerySchema = z.object({
  page: zQueryPage(1),
  limit: zQueryLimit(10),
  status: optionalUpperEnum(ORDER_STATUSES),
});

export function parseOrderListQuery(req: Request): { ok: true; value: OrderListQuery } | { ok: false; errors: string[] } {
  return zodQueryParse(orderListQuerySchema, req.query);
}

export function parseOrderPayment(req: Request): { ok: true; value: { paymentMethod: string } } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const pm = b.paymentMethod;
  if (typeof pm !== "string" || !pm.trim()) {
    return { ok: false, errors: ["paymentMethod is required"] };
  }
  return { ok: true, value: { paymentMethod: pm.trim() } };
}
