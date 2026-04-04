import type { Request } from "express";
import { clampLimit, clampPage } from "../../../utils/pagination";
import type { CreatePlanBody, PatchPlanBody, PlanListQuery } from "./recurringPlan.types";

const BILLING = new Set(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]);

export function parsePlanListQuery(
  req: Request
): { ok: true; value: PlanListQuery } | { ok: false; errors: string[] } {
  const q = req.query as Record<string, unknown>;
  const page = clampPage(Number(q.page) || 1);
  const limit = clampLimit(Number(q.limit) || 20);
  const search = q.search != null ? String(q.search).trim() : undefined;
  const status = q.status != null ? String(q.status).trim().toUpperCase() : undefined;
  if (status && !["ACTIVE", "INACTIVE"].includes(status)) {
    return { ok: false, errors: ["status must be ACTIVE or INACTIVE"] };
  }
  return { ok: true, value: { page, limit, search: search || undefined, status } };
}

export function parseCreatePlan(
  req: Request
): { ok: true; value: CreatePlanBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const planName = b.planName != null ? String(b.planName).trim() : "";
  const price = Number(b.price);
  const billingPeriod = b.billingPeriod != null ? String(b.billingPeriod).toUpperCase().trim() : "";
  if (!planName) return { ok: false, errors: ["planName is required"] };
  if (!Number.isFinite(price) || price < 0) return { ok: false, errors: ["price is required"] };
  if (!BILLING.has(billingPeriod)) {
    return { ok: false, errors: ["billingPeriod must be DAILY, WEEKLY, MONTHLY, or YEARLY"] };
  }
  return {
    ok: true,
    value: {
      planName,
      price,
      billingPeriod,
      minimumQuantity: b.minimumQuantity != null ? Number(b.minimumQuantity) : undefined,
      startDate: b.startDate != null ? String(b.startDate) : undefined,
      endDate: b.endDate != null ? String(b.endDate) : undefined,
      autoClose: b.autoClose !== undefined ? Boolean(b.autoClose) : undefined,
      closable: b.closable !== undefined ? Boolean(b.closable) : undefined,
      pausable: b.pausable !== undefined ? Boolean(b.pausable) : undefined,
      renewable: b.renewable !== undefined ? Boolean(b.renewable) : undefined,
      status: b.status != null ? String(b.status).toUpperCase() : undefined
    }
  };
}

export function parsePatchPlan(
  req: Request
): { ok: true; value: PatchPlanBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const out: PatchPlanBody = {};
  if (b.planName !== undefined) out.planName = String(b.planName).trim();
  if (b.price !== undefined) {
    const n = Number(b.price);
    if (!Number.isFinite(n) || n < 0) return { ok: false, errors: ["price invalid"] };
    out.price = n;
  }
  if (b.billingPeriod !== undefined) {
    const bp = String(b.billingPeriod).toUpperCase().trim();
    if (!BILLING.has(bp)) return { ok: false, errors: ["billingPeriod invalid"] };
    out.billingPeriod = bp;
  }
  if (b.minimumQuantity !== undefined) out.minimumQuantity = Number(b.minimumQuantity);
  if (b.startDate !== undefined) out.startDate = String(b.startDate);
  if (b.endDate !== undefined) out.endDate = String(b.endDate);
  if (b.autoClose !== undefined) out.autoClose = Boolean(b.autoClose);
  if (b.closable !== undefined) out.closable = Boolean(b.closable);
  if (b.pausable !== undefined) out.pausable = Boolean(b.pausable);
  if (b.renewable !== undefined) out.renewable = Boolean(b.renewable);
  if (b.status !== undefined) out.status = String(b.status).toUpperCase();
  if (Object.keys(out).length === 0) return { ok: false, errors: ["At least one field is required"] };
  return { ok: true, value: out };
}
