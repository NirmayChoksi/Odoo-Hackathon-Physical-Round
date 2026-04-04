import type { Request } from "express";
import { z } from "zod";
import { firstQueryValue, optionalPositiveIntQuery, zodQueryParse } from "../../../utils/zodSql";
import type { BillingPeriod, ReportExportQuery, ResolvedReportFilters } from "./report.types";

function localYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function defaultRange(): { fromDate: string; toDate: string } {
  const now = new Date();
  const toDate = localYmd(now);
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const fromDate = localYmd(first);
  return { fromDate, toDate };
}

const optionalYmd = z.preprocess((v) => {
  const x = firstQueryValue(v);
  if (x === undefined || x === null || x === "") return undefined;
  const s = String(x).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  return s;
}, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional());

const subscriptionStatuses = ["DRAFT", "QUOTATION", "CONFIRMED", "ACTIVE", "CLOSED"] as const;
const invoiceStatuses = ["DRAFT", "CONFIRMED", "PAID", "CANCELLED"] as const;
const paymentStatuses = ["PENDING", "SUCCESS", "FAILED", "REFUNDED"] as const;
const billingPeriods = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;

const reportFiltersSchema = z.object({
  fromDate: optionalYmd,
  toDate: optionalYmd,
  customerId: optionalPositiveIntQuery,
  productId: optionalPositiveIntQuery,
  planId: optionalPositiveIntQuery,
  subscriptionStatus: z.preprocess((v) => {
    const x = firstQueryValue(v);
    if (x === undefined || x === null || x === "") return undefined;
    return String(x).trim().toUpperCase();
  }, z.enum(subscriptionStatuses).optional()),
  invoiceStatus: z.preprocess((v) => {
    const x = firstQueryValue(v);
    if (x === undefined || x === null || x === "") return undefined;
    return String(x).trim().toUpperCase();
  }, z.enum(invoiceStatuses).optional()),
  paymentStatus: z.preprocess((v) => {
    const x = firstQueryValue(v);
    if (x === undefined || x === null || x === "") return undefined;
    return String(x).trim().toUpperCase();
  }, z.enum(paymentStatuses).optional()),
  billingPeriod: z.preprocess((v) => {
    const x = firstQueryValue(v);
    if (x === undefined || x === null || x === "") return undefined;
    return String(x).trim().toUpperCase();
  }, z.enum(billingPeriods).optional()),
});

export function parseResolvedReportFilters(
  req: Request
): { ok: true; value: ResolvedReportFilters } | { ok: false; errors: string[] } {
  const r = zodQueryParse(reportFiltersSchema, req.query);
  if (!r.ok) return r;
  const defs = defaultRange();
  const fromDate = r.value.fromDate ?? defs.fromDate;
  const toDate = r.value.toDate ?? defs.toDate;
  if (fromDate > toDate) {
    return { ok: false, errors: ["fromDate must be on or before toDate"] };
  }
  const value: ResolvedReportFilters = {
    fromDate,
    toDate,
    ...(r.value.customerId !== undefined ? { customerId: r.value.customerId } : {}),
    ...(r.value.productId !== undefined ? { productId: r.value.productId } : {}),
    ...(r.value.planId !== undefined ? { planId: r.value.planId } : {}),
    ...(r.value.subscriptionStatus !== undefined ? { subscriptionStatus: r.value.subscriptionStatus } : {}),
    ...(r.value.invoiceStatus !== undefined ? { invoiceStatus: r.value.invoiceStatus } : {}),
    ...(r.value.paymentStatus !== undefined ? { paymentStatus: r.value.paymentStatus } : {}),
    ...(r.value.billingPeriod !== undefined ? { billingPeriod: r.value.billingPeriod as BillingPeriod } : {}),
  };
  return { ok: true, value };
}

const exportTypes = ["revenue", "payments", "subscriptions", "invoices", "revenue_table"] as const;

const reportExportInnerSchema = z.object({
  type: z.preprocess(
    (v) => String(firstQueryValue(v) ?? "").trim().toLowerCase(),
    z.enum(exportTypes)
  ),
  format: z.preprocess((v) => {
    const x = firstQueryValue(v);
    if (x === undefined || x === null || x === "") return "json";
    return String(x).trim().toLowerCase();
  }, z.enum(["csv", "json"])),
});

export function parseReportExportQuery(
  req: Request
): { ok: true; value: ReportExportQuery } | { ok: false; errors: string[] } {
  const fr = parseResolvedReportFilters(req);
  if (!fr.ok) return fr;
  const er = zodQueryParse(reportExportInnerSchema, req.query);
  if (!er.ok) return er;
  return {
    ok: true,
    value: {
      type: er.value.type,
      format: er.value.format,
      filters: fr.value,
    },
  };
}
