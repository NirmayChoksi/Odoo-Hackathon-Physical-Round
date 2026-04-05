import type { Request } from "express";
import { z } from "zod";
import { optionalSearch, optionalUpperEnum, zodQueryParse, zQueryLimit, zQueryPage } from "../../../utils/zodSql";
import type {
  CreatePaymentTermBody,
  DueType,
  FeeDiscountType,
  PatchPaymentTermBody,
  PaymentMethodCode,
  PaymentTermInstallmentInput,
  PaymentTermListQuery,
  PaymentTermMethodInput,
  StartFrom,
} from "./paymentTerm.types";

const DUE_TYPES = new Set<DueType>(["IMMEDIATE", "FIXED_DAYS", "END_OF_MONTH", "SPLIT_PAYMENT"]);
const START_FROM = new Set<StartFrom>(["INVOICE_DATE", "SUBSCRIPTION_START_DATE"]);
const FEE_TYPES = new Set<FeeDiscountType>(["FIXED", "PERCENTAGE"]);
const METHODS = new Set<PaymentMethodCode>(["CARD", "BANK_TRANSFER", "UPI", "CASH"]);

const paymentTermListQuerySchema = z.object({
  page: zQueryPage(1),
  limit: zQueryLimit(50),
  search: optionalSearch(200),
  status: optionalUpperEnum(["ACTIVE", "INACTIVE"]),
});

export function parsePaymentTermListQuery(
  req: Request
): { ok: true; value: PaymentTermListQuery } | { ok: false; errors: string[] } {
  return zodQueryParse(paymentTermListQuerySchema, req.query);
}

function parseDueType(v: unknown): DueType | null {
  const s = v != null ? String(v).toUpperCase().trim() : "";
  return DUE_TYPES.has(s as DueType) ? (s as DueType) : null;
}

function parseStartFrom(v: unknown): StartFrom {
  const s = v != null ? String(v).toUpperCase().trim() : "INVOICE_DATE";
  return START_FROM.has(s as StartFrom) ? (s as StartFrom) : "INVOICE_DATE";
}

function parseFeeType(v: unknown): FeeDiscountType | null {
  if (v === undefined || v === null || v === "") return null;
  const s = String(v).toUpperCase().trim();
  return FEE_TYPES.has(s as FeeDiscountType) ? (s as FeeDiscountType) : null;
}

function parseMethod(v: unknown): PaymentMethodCode | null {
  const s = v != null ? String(v).toUpperCase().trim() : "";
  return METHODS.has(s as PaymentMethodCode) ? (s as PaymentMethodCode) : null;
}

function parseInstallments(raw: unknown): { ok: true; value: PaymentTermInstallmentInput[] } | { ok: false; errors: string[] } {
  if (raw === undefined || raw === null) return { ok: true, value: [] };
  if (!Array.isArray(raw)) return { ok: false, errors: ["installments must be an array"] };
  const out: PaymentTermInstallmentInput[] = [];
  for (let i = 0; i < raw.length; i++) {
    const row = raw[i] as Record<string, unknown>;
    const installmentNumber = Number(row.installmentNumber);
    const percentage = Number(row.percentage);
    const dueAfterDays = Number(row.dueAfterDays);
    if (!Number.isInteger(installmentNumber) || installmentNumber < 1) {
      return { ok: false, errors: [`installments[${i}].installmentNumber invalid`] };
    }
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      return { ok: false, errors: [`installments[${i}].percentage must be 0–100`] };
    }
    if (!Number.isInteger(dueAfterDays) || dueAfterDays < 0) {
      return { ok: false, errors: [`installments[${i}].dueAfterDays invalid`] };
    }
    out.push({
      installmentNumber,
      percentage,
      dueAfterDays,
      description: row.description != null ? String(row.description) : null,
    });
  }
  return { ok: true, value: out };
}

function parseMethods(raw: unknown): { ok: true; value: PaymentTermMethodInput[] } | { ok: false; errors: string[] } {
  if (raw === undefined || raw === null) return { ok: true, value: [] };
  if (!Array.isArray(raw)) return { ok: false, errors: ["methods must be an array"] };
  const out: PaymentTermMethodInput[] = [];
  for (let i = 0; i < raw.length; i++) {
    const row = raw[i] as Record<string, unknown>;
    const pm = parseMethod(row.paymentMethod);
    if (!pm) return { ok: false, errors: [`methods[${i}].paymentMethod invalid`] };
    out.push({
      paymentMethod: pm,
      isDefault: row.isDefault !== undefined ? Boolean(row.isDefault) : false,
    });
  }
  return { ok: true, value: out };
}

export function parseCreatePaymentTerm(
  req: Request
): { ok: true; value: CreatePaymentTermBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const termName = b.termName != null ? String(b.termName).trim() : "";
  if (!termName) return { ok: false, errors: ["termName is required"] };
  const dueType = parseDueType(b.dueType);
  if (!dueType) return { ok: false, errors: ["dueType is invalid"] };

  const inst = parseInstallments(b.installments);
  if (!inst.ok) return inst;
  const meth = parseMethods(b.methods);
  if (!meth.ok) return meth;

  return {
    ok: true,
    value: {
      termName,
      description: b.description != null ? String(b.description) : null,
      dueType,
      days: b.days !== undefined && b.days !== null && b.days !== "" ? Number(b.days) : null,
      graceDays: b.graceDays !== undefined && b.graceDays !== null && b.graceDays !== "" ? Number(b.graceDays) : 0,
      startFrom: parseStartFrom(b.startFrom),
      isDefault: Boolean(b.isDefault),
      status: b.status != null && String(b.status).toUpperCase() === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      enableLateFee: Boolean(b.enableLateFee),
      lateFeeType: parseFeeType(b.lateFeeType),
      lateFeeValue:
        b.lateFeeValue !== undefined && b.lateFeeValue !== null && b.lateFeeValue !== ""
          ? Number(b.lateFeeValue)
          : null,
      lateFeeAfterDays:
        b.lateFeeAfterDays !== undefined && b.lateFeeAfterDays !== null && b.lateFeeAfterDays !== ""
          ? Number(b.lateFeeAfterDays)
          : null,
      enableEarlyDiscount: Boolean(b.enableEarlyDiscount),
      earlyDiscountType: parseFeeType(b.earlyDiscountType),
      earlyDiscountValue:
        b.earlyDiscountValue !== undefined && b.earlyDiscountValue !== null && b.earlyDiscountValue !== ""
          ? Number(b.earlyDiscountValue)
          : null,
      earlyDiscountWithinDays:
        b.earlyDiscountWithinDays !== undefined &&
        b.earlyDiscountWithinDays !== null &&
        b.earlyDiscountWithinDays !== ""
          ? Number(b.earlyDiscountWithinDays)
          : null,
      notes: b.notes != null ? String(b.notes) : null,
      internalRemarks: b.internalRemarks != null ? String(b.internalRemarks) : null,
      installments: inst.value,
      methods: meth.value,
    },
  };
}

export function parsePatchPaymentTerm(
  req: Request
): { ok: true; value: PatchPaymentTermBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const out: PatchPaymentTermBody = {};
  if (b.termName !== undefined) out.termName = String(b.termName).trim();
  if (b.description !== undefined) out.description = b.description != null ? String(b.description) : null;
  if (b.dueType !== undefined) {
    const d = parseDueType(b.dueType);
    if (!d) return { ok: false, errors: ["dueType invalid"] };
    out.dueType = d;
  }
  if (b.days !== undefined) out.days = b.days === null || b.days === "" ? null : Number(b.days);
  if (b.graceDays !== undefined) out.graceDays = Number(b.graceDays);
  if (b.startFrom !== undefined) out.startFrom = parseStartFrom(b.startFrom);
  if (b.isDefault !== undefined) out.isDefault = Boolean(b.isDefault);
  if (b.status !== undefined) {
    const s = String(b.status).toUpperCase();
    if (s !== "ACTIVE" && s !== "INACTIVE") return { ok: false, errors: ["status invalid"] };
    out.status = s as "ACTIVE" | "INACTIVE";
  }
  if (b.enableLateFee !== undefined) out.enableLateFee = Boolean(b.enableLateFee);
  if (b.lateFeeType !== undefined) out.lateFeeType = parseFeeType(b.lateFeeType);
  if (b.lateFeeValue !== undefined) out.lateFeeValue = b.lateFeeValue === null || b.lateFeeValue === "" ? null : Number(b.lateFeeValue);
  if (b.lateFeeAfterDays !== undefined)
    out.lateFeeAfterDays = b.lateFeeAfterDays === null || b.lateFeeAfterDays === "" ? null : Number(b.lateFeeAfterDays);
  if (b.enableEarlyDiscount !== undefined) out.enableEarlyDiscount = Boolean(b.enableEarlyDiscount);
  if (b.earlyDiscountType !== undefined) out.earlyDiscountType = parseFeeType(b.earlyDiscountType);
  if (b.earlyDiscountValue !== undefined)
    out.earlyDiscountValue =
      b.earlyDiscountValue === null || b.earlyDiscountValue === "" ? null : Number(b.earlyDiscountValue);
  if (b.earlyDiscountWithinDays !== undefined)
    out.earlyDiscountWithinDays =
      b.earlyDiscountWithinDays === null || b.earlyDiscountWithinDays === ""
        ? null
        : Number(b.earlyDiscountWithinDays);
  if (b.notes !== undefined) out.notes = b.notes != null ? String(b.notes) : null;
  if (b.internalRemarks !== undefined) out.internalRemarks = b.internalRemarks != null ? String(b.internalRemarks) : null;
  if (b.replaceInstallments !== undefined) out.replaceInstallments = Boolean(b.replaceInstallments);
  if (b.replaceMethods !== undefined) out.replaceMethods = Boolean(b.replaceMethods);
  if (b.installments !== undefined) {
    const inst = parseInstallments(b.installments);
    if (!inst.ok) return inst;
    out.installments = inst.value;
  }
  if (b.methods !== undefined) {
    const meth = parseMethods(b.methods);
    if (!meth.ok) return meth;
    out.methods = meth.value;
  }
  if (Object.keys(out).length === 0) return { ok: false, errors: ["At least one field is required"] };
  return { ok: true, value: out };
}

export function parseAddInstallment(
  req: Request
): { ok: true; value: PaymentTermInstallmentInput } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const r = parseInstallments([b]);
  if (!r.ok) return r;
  return { ok: true, value: r.value[0] };
}

export function parsePatchInstallment(
  req: Request
): { ok: true; value: Partial<PaymentTermInstallmentInput> } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const out: Partial<PaymentTermInstallmentInput> = {};
  if (b.installmentNumber !== undefined) {
    const n = Number(b.installmentNumber);
    if (!Number.isInteger(n) || n < 1) return { ok: false, errors: ["installmentNumber invalid"] };
    out.installmentNumber = n;
  }
  if (b.percentage !== undefined) {
    const n = Number(b.percentage);
    if (!Number.isFinite(n) || n < 0 || n > 100) return { ok: false, errors: ["percentage invalid"] };
    out.percentage = n;
  }
  if (b.dueAfterDays !== undefined) {
    const n = Number(b.dueAfterDays);
    if (!Number.isInteger(n) || n < 0) return { ok: false, errors: ["dueAfterDays invalid"] };
    out.dueAfterDays = n;
  }
  if (b.description !== undefined) out.description = b.description != null ? String(b.description) : null;
  if (Object.keys(out).length === 0) return { ok: false, errors: ["At least one field is required"] };
  return { ok: true, value: out };
}

export function parseAddMethod(
  req: Request
): { ok: true; value: PaymentTermMethodInput } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const pm = parseMethod(b.paymentMethod);
  if (!pm) return { ok: false, errors: ["paymentMethod invalid"] };
  return { ok: true, value: { paymentMethod: pm, isDefault: Boolean(b.isDefault) } };
}
