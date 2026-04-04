import { dashboardRepository } from "../dashboard/dashboard.repository";
import { reportRepository } from "./report.repository";
import type { ReportExportQuery } from "./report.types";

export const reportService = {
  async summary() {
    const [active_subscriptions, total_revenue, overdue_invoices] = await Promise.all([
      dashboardRepository.countActiveSubscriptions(),
      dashboardRepository.sumSuccessfulPayments(),
      dashboardRepository.countOverdueInvoices()
    ]);
    return { active_subscriptions, total_revenue, overdue_invoices };
  },

  async activeSubscriptions() {
    const rows = await reportRepository.activeSubscriptions();
    return { subscriptions: rows };
  },

  async revenue() {
    const rows = await reportRepository.revenueByMonth(24);
    return { revenue_by_month: rows };
  },

  async payments() {
    const rows = await reportRepository.paymentsReport();
    return { payments: rows };
  },

  async overdueInvoices() {
    const rows = await reportRepository.overdueInvoices();
    return { invoices: rows };
  },

  async export(q: ReportExportQuery) {
    let rows: unknown[] = [];
    if (q.type === "revenue") rows = await reportRepository.revenueByMonth(24);
    else if (q.type === "payments") rows = await reportRepository.paymentsReport();
    else if (q.type === "subscriptions") rows = await reportRepository.activeSubscriptions();
    else if (q.type === "invoices") rows = await reportRepository.overdueInvoices();

    if (q.format === "csv") {
      const header = rows[0] && typeof rows[0] === "object" ? Object.keys(rows[0] as object).join(",") : "";
      const lines = rows.map((r) =>
        Object.values(r as Record<string, unknown>)
          .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
          .join(",")
      );
      return { format: "csv" as const, content: [header, ...lines].filter(Boolean).join("\n") };
    }
    return { format: "json" as const, data: rows };
  }
};
