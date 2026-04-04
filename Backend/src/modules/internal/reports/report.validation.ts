import type { Request } from "express";
import type { ReportExportQuery } from "./report.types";

const TYPES = new Set(["revenue", "payments", "subscriptions", "invoices"]);
const FORMATS = new Set(["csv", "json"]);

export function parseReportExportQuery(
  req: Request
): { ok: true; value: ReportExportQuery } | { ok: false; errors: string[] } {
  const q = req.query as Record<string, unknown>;
  const type = q.type != null ? String(q.type).toLowerCase() : "";
  const format = q.format != null ? String(q.format).toLowerCase() : "json";
  if (!TYPES.has(type)) return { ok: false, errors: ["type must be revenue, payments, subscriptions, or invoices"] };
  if (!FORMATS.has(format)) return { ok: false, errors: ["format must be csv or json"] };
  return { ok: true, value: { type, format } };
}
