import type { Request } from "express";
import { z } from "zod";
import { firstQueryValue, zodQueryParse } from "../../../utils/zodSql";
import type { ReportExportQuery } from "./report.types";

const reportExportQuerySchema = z.object({
  type: z.preprocess(
    (v) => String(firstQueryValue(v) ?? "").trim().toLowerCase(),
    z.enum(["revenue", "payments", "subscriptions", "invoices"])
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
  return zodQueryParse(reportExportQuerySchema, req.query);
}
