import type { Request } from "express";
import type { InvoicePaymentBody } from "./invoice.types";

export function parseInvoicePayment(req: Request): { ok: true; value: InvoicePaymentBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const pm = b.paymentMethod;
  if (typeof pm !== "string" || !pm.trim()) {
    return { ok: false, errors: ["paymentMethod is required"] };
  }
  return { ok: true, value: { paymentMethod: pm.trim() } };
}
