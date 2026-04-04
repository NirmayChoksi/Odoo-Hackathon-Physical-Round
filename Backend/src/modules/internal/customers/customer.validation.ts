import type { Request } from "express";
import { clampLimit, clampPage } from "../../../utils/pagination";
import type { CreateCustomerBody, CustomerListQuery, PatchCustomerBody } from "./customer.types";

export function parseCustomerListQuery(
  req: Request
): { ok: true; value: CustomerListQuery } | { ok: false; errors: string[] } {
  const q = req.query as Record<string, unknown>;
  const page = clampPage(Number(q.page) || 1);
  const limit = clampLimit(Number(q.limit) || 10);
  const search = q.search != null ? String(q.search).trim() : undefined;
  const status = q.status != null ? String(q.status).trim().toUpperCase() : undefined;
  if (status && !["ACTIVE", "INACTIVE"].includes(status)) {
    return { ok: false, errors: ["status must be ACTIVE or INACTIVE"] };
  }
  return { ok: true, value: { page, limit, search: search || undefined, status } };
}

export function parseCreateCustomer(
  req: Request
): { ok: true; value: CreateCustomerBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const customerName = b.customerName != null ? String(b.customerName).trim() : "";
  if (!customerName) return { ok: false, errors: ["customerName is required"] };
  const portalUserId = b.portalUserId;
  let pid: number | null | undefined = undefined;
  if (portalUserId === null) pid = null;
  else if (portalUserId !== undefined) {
    const n = Number(portalUserId);
    if (!Number.isInteger(n) || n < 1) return { ok: false, errors: ["portalUserId must be positive or null"] };
    pid = n;
  }
  return {
    ok: true,
    value: {
      customerName,
      email: b.email != null ? String(b.email).trim() : undefined,
      phone: b.phone != null ? String(b.phone).trim() : undefined,
      companyName: b.companyName != null ? String(b.companyName).trim() : undefined,
      billingAddress: b.billingAddress != null ? String(b.billingAddress) : undefined,
      shippingAddress: b.shippingAddress != null ? String(b.shippingAddress) : undefined,
      taxNumber: b.taxNumber != null ? String(b.taxNumber).trim() : undefined,
      portalUserId: pid,
      status: b.status != null ? String(b.status).toUpperCase() : undefined
    }
  };
}

export function parsePatchCustomer(
  req: Request
): { ok: true; value: PatchCustomerBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const out: PatchCustomerBody = {};
  if (b.customerName !== undefined) out.customerName = String(b.customerName).trim();
  if (b.email !== undefined) out.email = String(b.email).trim();
  if (b.phone !== undefined) out.phone = String(b.phone).trim();
  if (b.companyName !== undefined) out.companyName = String(b.companyName).trim();
  if (b.billingAddress !== undefined) out.billingAddress = String(b.billingAddress);
  if (b.shippingAddress !== undefined) out.shippingAddress = String(b.shippingAddress);
  if (b.taxNumber !== undefined) out.taxNumber = String(b.taxNumber).trim();
  if (b.portalUserId !== undefined) {
    if (b.portalUserId === null) out.portalUserId = null;
    else {
      const n = Number(b.portalUserId);
      if (!Number.isInteger(n) || n < 1) return { ok: false, errors: ["portalUserId invalid"] };
      out.portalUserId = n;
    }
  }
  if (b.status !== undefined) out.status = String(b.status).toUpperCase();
  if (Object.keys(out).length === 0) return { ok: false, errors: ["At least one field is required"] };
  return { ok: true, value: out };
}
