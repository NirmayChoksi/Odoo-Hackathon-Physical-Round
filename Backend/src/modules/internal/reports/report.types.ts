export type BillingPeriod = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

/** Normalized filters after validation (always includes a date range). */
export interface ResolvedReportFilters {
  fromDate: string;
  toDate: string;
  customerId?: number;
  productId?: number;
  planId?: number;
  subscriptionStatus?: string;
  invoiceStatus?: string;
  paymentStatus?: string;
  billingPeriod?: BillingPeriod;
}

export interface ReportSummary {
  activeSubscriptions: number;
  newSubscriptions: number;
  renewedSubscriptions: number;
  closedSubscriptions: number;
  totalRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  avgRevenuePerSubscription: number;
  totalPayments: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  refundedPayments: number;
  overdueInvoices: number;
  overdueAmount: number;
  overdueCustomers: number;
  highestOverdueAmount: number;
}

export interface RevenueTrendItem {
  label: string;
  revenue: number;
}

export interface StatusCountItem {
  status: string;
  count: number;
}

export interface OverdueTrendItem {
  label: string;
  overdueAmount: number;
  count: number;
}

export interface ActiveSubscriptionRow {
  subscriptionNumber: string;
  customerName: string;
  planName: string;
  startDate: string;
  expirationDate: string | null;
  status: string;
  totalAmount: number;
}

export interface RevenueTableRow {
  month: string;
  invoicedRevenue: number;
  paidRevenue: number;
  outstandingRevenue: number;
}

export interface PaymentReportRow {
  paymentDate: string;
  customerName: string;
  invoiceNumber: string;
  paymentMethod: string;
  amount: number;
  status: string;
}

export interface OverdueInvoiceRow {
  invoiceNumber: string;
  customerName: string;
  dueDate: string;
  dueAmount: number;
  daysOverdue: number;
  invoiceStatus: string;
}

export interface ReportingPageData {
  summary: ReportSummary;
  revenueTrend: RevenueTrendItem[];
  subscriptionStatusChart: StatusCountItem[];
  paymentStatusChart: StatusCountItem[];
  overdueTrend: OverdueTrendItem[];
  activeSubscriptionsTable: ActiveSubscriptionRow[];
  revenueTable: RevenueTableRow[];
  paymentsTable: PaymentReportRow[];
  overdueInvoicesTable: OverdueInvoiceRow[];
}

export interface ReportMetaOption {
  id: number;
  label: string;
}

export interface ReportMeta {
  customers: ReportMetaOption[];
  products: ReportMetaOption[];
  plans: ReportMetaOption[];
}

export interface ReportExportQuery {
  type: string;
  format: string;
  filters: ResolvedReportFilters;
}
