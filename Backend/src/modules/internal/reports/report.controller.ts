import type { Request, Response } from "express";
import { success } from "../../../utils/apiResponse";
import { parseReportExportQuery, parseResolvedReportFilters } from "./report.validation";
import { reportService } from "./report.service";

function sendFilterError(res: Response, errors: string[]): void {
  res.status(400).json({ success: false, message: "Invalid query", errors });
}

export const reportController = {
  async page(req: Request, res: Response): Promise<void> {
    const r = parseResolvedReportFilters(req);
    if (!r.ok) {
      sendFilterError(res, r.errors);
      return;
    }
    const data = await reportService.page(r.value);
    res.json(success(data));
  },

  async meta(_req: Request, res: Response): Promise<void> {
    const data = await reportService.meta();
    res.json(success(data));
  },

  async summary(req: Request, res: Response): Promise<void> {
    const r = parseResolvedReportFilters(req);
    if (!r.ok) {
      sendFilterError(res, r.errors);
      return;
    }
    const data = await reportService.summary(r.value);
    res.json(success(data));
  },

  async activeSubscriptions(req: Request, res: Response): Promise<void> {
    const r = parseResolvedReportFilters(req);
    if (!r.ok) {
      sendFilterError(res, r.errors);
      return;
    }
    const data = await reportService.activeSubscriptions(r.value);
    res.json(success(data));
  },

  async revenue(req: Request, res: Response): Promise<void> {
    const r = parseResolvedReportFilters(req);
    if (!r.ok) {
      sendFilterError(res, r.errors);
      return;
    }
    const data = await reportService.revenue(r.value);
    res.json(success(data));
  },

  async payments(req: Request, res: Response): Promise<void> {
    const r = parseResolvedReportFilters(req);
    if (!r.ok) {
      sendFilterError(res, r.errors);
      return;
    }
    const data = await reportService.payments(r.value);
    res.json(success(data));
  },

  async overdueInvoices(req: Request, res: Response): Promise<void> {
    const r = parseResolvedReportFilters(req);
    if (!r.ok) {
      sendFilterError(res, r.errors);
      return;
    }
    const data = await reportService.overdueInvoices(r.value);
    res.json(success(data));
  },

  async export(req: Request, res: Response): Promise<void> {
    const r = parseReportExportQuery(req);
    if (!r.ok) {
      sendFilterError(res, r.errors);
      return;
    }
    const out = await reportService.export(r.value);
    if (out.format === "csv") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=\"report.csv\"");
      res.send(out.content);
      return;
    }
    res.json(success(out.data));
  },
};
