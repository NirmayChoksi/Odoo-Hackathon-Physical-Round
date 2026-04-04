import type { RowDataPacket } from "mysql2";
import { reportRepository } from "./report.repository";
import type {
  ActiveSubscriptionRow,
  OverdueInvoiceRow,
  PaymentReportRow,
  ReportExportQuery,
  ReportingPageData,
  ReportMeta,
  ReportSummary,
  ResolvedReportFilters,
  RevenueTableRow,
  RevenueTrendItem,
  StatusCountItem,
  OverdueTrendItem,
} from "./report.types";

const SUBSCRIPTION_STATUSES = ["DRAFT", "QUOTATION", "CONFIRMED", "ACTIVE", "CLOSED"] as const;
const PAYMENT_STATUSES = ["PENDING", "SUCCESS", "FAILED", "REFUNDED"] as const;

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fillStatusMap(rows: RowDataPacket[], keyField: string, all: readonly string[]): StatusCountItem[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = String(r[keyField] ?? "").toUpperCase();
    map.set(k, num(r.c));
  }
  return all.map((status) => ({
    status,
    count: map.get(status) ?? 0,
  }));
}

function mergeRevenueTable(
  invoiced: RowDataPacket[],
  paid: RowDataPacket[]
): RevenueTableRow[] {
  const map = new Map<string, { inv: number; paid: number }>();
  for (const r of invoiced) {
    const ym = String(r.ym ?? "");
    map.set(ym, { inv: num(r.total), paid: 0 });
  }
  for (const r of paid) {
    const ym = String(r.ym ?? "");
    const cur = map.get(ym) ?? { inv: 0, paid: 0 };
    cur.paid = num(r.total);
    map.set(ym, cur);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ym, v]) => ({
      month: reportRepository.monthLabel(ym),
      invoicedRevenue: v.inv,
      paidRevenue: v.paid,
      outstandingRevenue: Math.max(0, v.inv - v.paid),
    }));
}

async function buildSummary(f: ResolvedReportFilters): Promise<ReportSummary> {
  const [
    activeSubscriptions,
    newSubscriptions,
    closedSubscriptions,
    renewedSubscriptions,
    totalRevenue,
    monthlyRevenue,
    yearlyRevenue,
    totalPayments,
    successfulPayments,
    pendingPayments,
    failedPayments,
    refundedPayments,
    overdue,
  ] = await Promise.all([
    reportRepository.countActiveSubscriptions(f),
    reportRepository.countNewSubscriptions(f),
    reportRepository.countClosedSubscriptions(f),
    reportRepository.countRenewedSubscriptions(f),
    reportRepository.sumSuccessfulPaymentsBetween(f),
    reportRepository.sumSuccessfulPaymentsInMonthOf(f, f.toDate),
    reportRepository.sumSuccessfulPaymentsInYearOf(f, f.toDate),
    reportRepository.countTotalPaymentsInRange(f),
    reportRepository.countPaymentsByStatus(f, "SUCCESS"),
    reportRepository.countPaymentsByStatus(f, "PENDING"),
    reportRepository.countPaymentsByStatus(f, "FAILED"),
    reportRepository.countPaymentsByStatus(f, "REFUNDED"),
    reportRepository.overdueAggregate(f),
  ]);

  const avgRevenuePerSubscription =
    activeSubscriptions > 0 ? Math.round((totalRevenue / activeSubscriptions) * 100) / 100 : 0;

  return {
    activeSubscriptions,
    newSubscriptions,
    renewedSubscriptions,
    closedSubscriptions,
    totalRevenue,
    monthlyRevenue,
    yearlyRevenue,
    avgRevenuePerSubscription,
    totalPayments,
    successfulPayments,
    pendingPayments,
    failedPayments,
    refundedPayments,
    overdueInvoices: overdue.count,
    overdueAmount: overdue.amount,
    overdueCustomers: overdue.customers,
    highestOverdueAmount: overdue.highest,
  };
}

function mapActiveRows(rows: RowDataPacket[]): ActiveSubscriptionRow[] {
  return rows.map((r) => ({
    subscriptionNumber: String(r.subscription_number ?? ""),
    customerName: String(r.customer_name ?? ""),
    planName: String(r.plan_name ?? ""),
    startDate: String(r.start_date ?? ""),
    expirationDate: r.expiration_date ? String(r.expiration_date) : null,
    status: String(r.status ?? ""),
    totalAmount: num(r.total_amount),
  }));
}

function mapPaymentRows(rows: RowDataPacket[]): PaymentReportRow[] {
  return rows.map((r) => ({
    paymentDate: String(r.payment_date ?? ""),
    customerName: String(r.customer_name ?? ""),
    invoiceNumber: String(r.invoice_number ?? ""),
    paymentMethod: String(r.payment_method ?? ""),
    amount: num(r.amount),
    status: String(r.payment_status ?? ""),
  }));
}

function mapOverdueRows(rows: RowDataPacket[]): OverdueInvoiceRow[] {
  return rows.map((r) => ({
    invoiceNumber: String(r.invoice_number ?? ""),
    customerName: String(r.customer_name ?? ""),
    dueDate: String(r.due_date ?? ""),
    dueAmount: num(r.due_amount),
    daysOverdue: num(r.days_overdue),
    invoiceStatus: String(r.invoice_status ?? ""),
  }));
}

export const reportService = {
  async summary(f: ResolvedReportFilters): Promise<ReportSummary> {
    return buildSummary(f);
  },

  async page(f: ResolvedReportFilters): Promise<ReportingPageData> {
    const [
      summary,
      trendRows,
      subStatusRows,
      payStatusRows,
      overdueTrendRows,
      invByMonth,
      paidByMonth,
      activeRows,
      payRows,
      overdueRows,
    ] = await Promise.all([
      buildSummary(f),
      reportRepository.revenueTrendByMonth(f),
      reportRepository.subscriptionStatusCounts(f),
      reportRepository.paymentStatusCounts(f),
      reportRepository.overdueTrendByMonth(f),
      reportRepository.invoicedByMonth(f),
      reportRepository.paidByMonth(f),
      reportRepository.activeSubscriptionsRows(f),
      reportRepository.paymentsReportRows(f),
      reportRepository.overdueInvoicesRows(f),
    ]);

    const revenueTrend: RevenueTrendItem[] = trendRows.map((r) => ({
      label: reportRepository.monthLabel(String(r.ym ?? "")),
      revenue: num(r.revenue),
    }));

    const subscriptionStatusChart = fillStatusMap(subStatusRows, "status", SUBSCRIPTION_STATUSES);
    const paymentStatusChart = fillStatusMap(payStatusRows, "status", PAYMENT_STATUSES);

    const overdueTrend: OverdueTrendItem[] = overdueTrendRows.map((r) => ({
      label: reportRepository.monthLabel(String(r.ym ?? "")),
      overdueAmount: num(r.overdue_amount),
      count: num(r.cnt),
    }));

    return {
      summary,
      revenueTrend,
      subscriptionStatusChart,
      paymentStatusChart,
      overdueTrend,
      activeSubscriptionsTable: mapActiveRows(activeRows),
      revenueTable: mergeRevenueTable(invByMonth, paidByMonth),
      paymentsTable: mapPaymentRows(payRows),
      overdueInvoicesTable: mapOverdueRows(overdueRows),
    };
  },

  async meta(): Promise<ReportMeta> {
    const [customers, products, plans] = await Promise.all([
      reportRepository.listCustomersMeta(),
      reportRepository.listProductsMeta(),
      reportRepository.listPlansMeta(),
    ]);
    const mapOpt = (rows: RowDataPacket[]) =>
      rows.map((r) => ({ id: num(r.id), label: String(r.label ?? "") }));
    return {
      customers: mapOpt(customers),
      products: mapOpt(products),
      plans: mapOpt(plans),
    };
  },

  async activeSubscriptions(f: ResolvedReportFilters) {
    const rows = await reportRepository.activeSubscriptionsRows(f);
    return { subscriptions: mapActiveRows(rows) };
  },

  async revenue(f: ResolvedReportFilters) {
    const [trendRows, invByMonth, paidByMonth] = await Promise.all([
      reportRepository.revenueTrendByMonth(f),
      reportRepository.invoicedByMonth(f),
      reportRepository.paidByMonth(f),
    ]);
    const revenueTrend = trendRows.map((r) => ({
      label: reportRepository.monthLabel(String(r.ym ?? "")),
      revenue: num(r.revenue),
    }));
    return {
      revenueTrend,
      revenueTable: mergeRevenueTable(invByMonth, paidByMonth),
    };
  },

  async payments(f: ResolvedReportFilters) {
    const [payStatusRows, payRows] = await Promise.all([
      reportRepository.paymentStatusCounts(f),
      reportRepository.paymentsReportRows(f),
    ]);
    return {
      paymentStatusChart: fillStatusMap(payStatusRows, "status", PAYMENT_STATUSES),
      payments: mapPaymentRows(payRows),
    };
  },

  async overdueInvoices(f: ResolvedReportFilters) {
    const [trendRows, rows] = await Promise.all([
      reportRepository.overdueTrendByMonth(f),
      reportRepository.overdueInvoicesRows(f),
    ]);
    return {
      overdueTrend: trendRows.map((r) => ({
        label: reportRepository.monthLabel(String(r.ym ?? "")),
        overdueAmount: num(r.overdue_amount),
        count: num(r.cnt),
      })),
      invoices: mapOverdueRows(rows),
    };
  },

  async export(q: ReportExportQuery) {
    const f = q.filters;
    let rows: unknown[] = [];
    if (q.type === "revenue") {
      const t = await reportRepository.revenueTrendByMonth(f);
      rows = t.map((r) => ({
        month: reportRepository.monthLabel(String(r.ym ?? "")),
        revenue: num(r.revenue),
      }));
    } else if (q.type === "revenue_table") {
      const [inv, paid] = await Promise.all([
        reportRepository.invoicedByMonth(f),
        reportRepository.paidByMonth(f),
      ]);
      rows = mergeRevenueTable(inv, paid);
    } else if (q.type === "payments") {
      rows = mapPaymentRows(await reportRepository.paymentsReportRows(f));
    } else if (q.type === "subscriptions") {
      rows = await reportRepository.activeSubscriptionsRaw(f);
    } else if (q.type === "invoices") {
      rows = mapOverdueRows(await reportRepository.overdueInvoicesRows(f));
    }

    if (q.format === "csv") {
      const header =
        rows[0] && typeof rows[0] === "object" ? Object.keys(rows[0] as object).join(",") : "";
      const lines = rows.map((r) =>
        Object.values(r as Record<string, unknown>)
          .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
          .join(",")
      );
      return { format: "csv" as const, content: [header, ...lines].filter(Boolean).join("\n") };
    }
    return { format: "json" as const, data: rows };
  },
};
