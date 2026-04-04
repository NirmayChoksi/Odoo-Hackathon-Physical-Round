import type { Request, Response } from "express";
import { success } from "../../../utils/apiResponse";
import { parseReportExportQuery } from "./report.validation";
import { reportService } from "./report.service";

export const reportController = {
  async summary(_req: Request, res: Response): Promise<void> {
    const data = await reportService.summary();
    res.json(success(data));
  },

  async activeSubscriptions(_req: Request, res: Response): Promise<void> {
    const data = await reportService.activeSubscriptions();
    res.json(success(data));
  },

  async revenue(_req: Request, res: Response): Promise<void> {
    const data = await reportService.revenue();
    res.json(success(data));
  },

  async payments(_req: Request, res: Response): Promise<void> {
    const data = await reportService.payments();
    res.json(success(data));
  },

  async overdueInvoices(_req: Request, res: Response): Promise<void> {
    const data = await reportService.overdueInvoices();
    res.json(success(data));
  },

  async export(req: Request, res: Response): Promise<void> {
    const r = parseReportExportQuery(req);
    if (!r.ok) {
      res.status(400).json({ success: false, message: "Invalid query", errors: r.errors });
      return;
    }
    const out = await reportService.export(r.value);
    if (out.format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.send(out.content);
      return;
    }
    res.json(success(out.data));
  }
};
