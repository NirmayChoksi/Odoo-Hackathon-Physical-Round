import type { Request } from "express";
import { z } from "zod";
import { optionalPositiveIntQuery, optionalUpperEnum, zodQueryParse, zQueryLimit, zQueryPage } from "../../../utils/zodSql";
import type { PaymentListQuery, RecordPaymentBody } from "./payment.types";

function num(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

const paymentListQuerySchema = z.object({
  page: zQueryPage(1),
  limit: zQueryLimit(20),
  invoiceId: optionalPositiveIntQuery,
  status: optionalUpperEnum(["PENDING", "SUCCESS", "FAILED", "REFUNDED"]),
});

export function parsePaymentListQuery(
  req: Request
): { ok: true; value: PaymentListQuery } | { ok: false; errors: string[] } {
  return zodQueryParse(paymentListQuerySchema, req.query);
}

export function parseRecordPayment(
  req: Request
): { ok: true; value: RecordPaymentBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const invoiceId = num(b.invoiceId);
  const customerId = num(b.customerId);
  const amount = num(b.amount);
  const paymentMethod = b.paymentMethod != null ? String(b.paymentMethod).trim() : "";
  const errors: string[] = [];
  if (invoiceId === undefined || !Number.isInteger(invoiceId) || invoiceId < 1) errors.push("invoiceId is required");
  if (customerId === undefined || !Number.isInteger(customerId) || customerId < 1) errors.push("customerId is required");
  if (!paymentMethod) errors.push("paymentMethod is required");
  if (amount === undefined || amount <= 0) errors.push("amount is required");
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      invoiceId: invoiceId!,
      customerId: customerId!,
      paymentMethod,
      amount: amount!
    }
  };
}
