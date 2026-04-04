import type { Request } from "express";
import { clampLimit, clampPage } from "../../../utils/pagination";
import type { PaymentListQuery, RecordPaymentBody } from "./payment.types";

function num(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function parsePaymentListQuery(
  req: Request
): { ok: true; value: PaymentListQuery } | { ok: false; errors: string[] } {
  const q = req.query as Record<string, unknown>;
  const page = clampPage(Number(q.page) || 1);
  const limit = clampLimit(Number(q.limit) || 20);
  const invoiceId = num(q.invoiceId);
  const status = q.status != null ? String(q.status).trim().toUpperCase() : undefined;
  const allowed = new Set(["PENDING", "SUCCESS", "FAILED", "REFUNDED"]);
  if (status && !allowed.has(status)) return { ok: false, errors: ["Invalid payment status"] };
  if (q.invoiceId !== undefined && invoiceId !== undefined && (!Number.isInteger(invoiceId) || invoiceId < 1)) {
    return { ok: false, errors: ["invoiceId invalid"] };
  }
  return {
    ok: true,
    value: {
      page,
      limit,
      invoiceId: invoiceId !== undefined && Number.isInteger(invoiceId) ? invoiceId : undefined,
      status
    }
  };
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
