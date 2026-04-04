import type { RowDataPacket } from "mysql2";
import { pool } from "../../../config/db";
import type { ResolvedReportFilters } from "./report.types";

/** AND clauses for `subscriptions` alias `s` (no leading AND). */
function subscriptionClauses(f: ResolvedReportFilters): { sql: string; params: unknown[] } {
  const parts: string[] = [];
  const params: unknown[] = [];
  if (f.customerId !== undefined) {
    parts.push("s.customer_id = ?");
    params.push(f.customerId);
  }
  if (f.planId !== undefined) {
    parts.push("s.plan_id = ?");
    params.push(f.planId);
  }
  if (f.subscriptionStatus !== undefined) {
    parts.push("s.status = ?");
    params.push(f.subscriptionStatus);
  }
  if (f.billingPeriod !== undefined) {
    parts.push(
      "EXISTS (SELECT 1 FROM recurring_plans rp_bp WHERE rp_bp.plan_id = s.plan_id AND rp_bp.billing_period = ?)"
    );
    params.push(f.billingPeriod);
  }
  if (f.productId !== undefined) {
    parts.push(
      "EXISTS (SELECT 1 FROM subscription_items si_f WHERE si_f.subscription_id = s.subscription_id AND si_f.product_id = ?)"
    );
    params.push(f.productId);
  }
  return { sql: parts.length ? ` AND ${parts.join(" AND ")}` : "", params };
}

function invoiceExtraClause(f: ResolvedReportFilters): { sql: string; params: unknown[] } {
  if (f.invoiceStatus === undefined) return { sql: "", params: [] };
  return { sql: " AND i.status = ?", params: [f.invoiceStatus] };
}

function paymentExtraClause(f: ResolvedReportFilters): { sql: string; params: unknown[] } {
  if (f.paymentStatus === undefined) return { sql: "", params: [] };
  return { sql: " AND p.payment_status = ?", params: [f.paymentStatus] };
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
}

export const reportRepository = {
  async countActiveSubscriptions(f: ResolvedReportFilters): Promise<number> {
    const sub = subscriptionClauses(f);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM subscriptions s WHERE s.status = 'ACTIVE'${sub.sql}`,
      sub.params
    );
    return Number(rows[0]?.c ?? 0);
  },

  async countNewSubscriptions(f: ResolvedReportFilters): Promise<number> {
    const sub = subscriptionClauses(f);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM subscriptions s
       WHERE DATE(s.created_at) BETWEEN ? AND ?${sub.sql}`,
      [f.fromDate, f.toDate, ...sub.params]
    );
    return Number(rows[0]?.c ?? 0);
  },

  async countClosedSubscriptions(f: ResolvedReportFilters): Promise<number> {
    const sub = subscriptionClauses(f);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM subscriptions s
       WHERE s.status = 'CLOSED' AND DATE(s.updated_at) BETWEEN ? AND ?${sub.sql}`,
      [f.fromDate, f.toDate, ...sub.params]
    );
    return Number(rows[0]?.c ?? 0);
  },

  async countRenewedSubscriptions(f: ResolvedReportFilters): Promise<number> {
    const sub = subscriptionClauses(f);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT h.subscription_id) AS c
       FROM subscription_history h
       INNER JOIN subscriptions s ON s.subscription_id = h.subscription_id
       WHERE h.new_status = 'ACTIVE'
         AND h.old_status IN ('CONFIRMED', 'CLOSED', 'QUOTATION')
         AND DATE(h.changed_at) BETWEEN ? AND ?${sub.sql}`,
      [f.fromDate, f.toDate, ...sub.params]
    );
    return Number(rows[0]?.c ?? 0);
  },

  async sumSuccessfulPaymentsBetween(f: ResolvedReportFilters): Promise<number> {
    const sub = subscriptionClauses(f);
    const pay = paymentExtraClause(f);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(p.amount), 0) AS s
       FROM payments p
       INNER JOIN invoices i ON i.invoice_id = p.invoice_id
       INNER JOIN subscriptions s ON s.subscription_id = i.subscription_id
       WHERE p.payment_status = 'SUCCESS'
         AND DATE(p.payment_date) BETWEEN ? AND ?${sub.sql}${pay.sql}`,
      [f.fromDate, f.toDate, ...sub.params, ...pay.params]
    );
    return Number(rows[0]?.s ?? 0);
  },

  async sumSuccessfulPaymentsInMonthOf(f: ResolvedReportFilters, refYmd: string): Promise<number> {
    const sub = subscriptionClauses(f);
    const pay = paymentExtraClause(f);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(p.amount), 0) AS s
       FROM payments p
       INNER JOIN invoices i ON i.invoice_id = p.invoice_id
       INNER JOIN subscriptions s ON s.subscription_id = i.subscription_id
       WHERE p.payment_status = 'SUCCESS'
         AND YEAR(p.payment_date) = YEAR(?)
         AND MONTH(p.payment_date) = MONTH(?)${sub.sql}${pay.sql}`,
      [refYmd, refYmd, ...sub.params, ...pay.params]
    );
    return Number(rows[0]?.s ?? 0);
  },

  async sumSuccessfulPaymentsInYearOf(f: ResolvedReportFilters, refYmd: string): Promise<number> {
    const sub = subscriptionClauses(f);
    const pay = paymentExtraClause(f);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(p.amount), 0) AS s
       FROM payments p
       INNER JOIN invoices i ON i.invoice_id = p.invoice_id
       INNER JOIN subscriptions s ON s.subscription_id = i.subscription_id
       WHERE p.payment_status = 'SUCCESS'
         AND YEAR(p.payment_date) = YEAR(?)${sub.sql}${pay.sql}`,
      [refYmd, ...sub.params, ...pay.params]
    );
    return Number(rows[0]?.s ?? 0);
  },

  async countPaymentsByStatus(
    f: ResolvedReportFilters,
    status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED"
  ): Promise<number> {
    const sub = subscriptionClauses(f);
    const pay = paymentExtraClause(f);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c
       FROM payments p
       INNER JOIN invoices i ON i.invoice_id = p.invoice_id
       INNER JOIN subscriptions s ON s.subscription_id = i.subscription_id
       WHERE p.payment_status = ?
         AND DATE(p.payment_date) BETWEEN ? AND ?${sub.sql}${pay.sql}`,
      [status, f.fromDate, f.toDate, ...sub.params, ...pay.params]
    );
    return Number(rows[0]?.c ?? 0);
  },

  async countTotalPaymentsInRange(f: ResolvedReportFilters): Promise<number> {
    const sub = subscriptionClauses(f);
    const pay = paymentExtraClause(f);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c
       FROM payments p
       INNER JOIN invoices i ON i.invoice_id = p.invoice_id
       INNER JOIN subscriptions s ON s.subscription_id = i.subscription_id
       WHERE DATE(p.payment_date) BETWEEN ? AND ?${sub.sql}${pay.sql}`,
      [f.fromDate, f.toDate, ...sub.params, ...pay.params]
    );
    return Number(rows[0]?.c ?? 0);
  },

  async overdueAggregate(f: ResolvedReportFilters): Promise<{
    count: number;
    amount: number;
    customers: number;
    highest: number;
  }> {
    const sub = subscriptionClauses(f);
    const inv = invoiceExtraClause(f);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         COUNT(*) AS cnt,
         COALESCE(SUM(i.total_amount), 0) AS amt,
         COUNT(DISTINCT i.customer_id) AS cust,
         COALESCE(MAX(i.total_amount), 0) AS hi
       FROM invoices i
       INNER JOIN subscriptions s ON s.subscription_id = i.subscription_id
       WHERE i.status IN ('DRAFT', 'CONFIRMED')
         AND i.due_date IS NOT NULL
         AND i.due_date < CURDATE()${sub.sql}${inv.sql}`,
      [...sub.params, ...inv.params]
    );
    const row = rows[0];
    return {
      count: Number(row?.cnt ?? 0),
      amount: Number(row?.amt ?? 0),
      customers: Number(row?.cust ?? 0),
      highest: Number(row?.hi ?? 0),
    };
  },

  async subscriptionStatusCounts(f: ResolvedReportFilters): Promise<RowDataPacket[]> {
    const sub = subscriptionClauses(f);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT s.status AS status, COUNT(*) AS c
       FROM subscriptions s
       WHERE 1=1${sub.sql}
       GROUP BY s.status
       ORDER BY s.status`,
      sub.params
    );
    return rows;
  },

  async paymentStatusCounts(f: ResolvedReportFilters): Promise<RowDataPacket[]> {
    const sub = subscriptionClauses(f);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.payment_status AS status, COUNT(*) AS c
       FROM payments p
       INNER JOIN invoices i ON i.invoice_id = p.invoice_id
       INNER JOIN subscriptions s ON s.subscription_id = i.subscription_id
       WHERE DATE(p.payment_date) BETWEEN ? AND ?${sub.sql}
       GROUP BY p.payment_status`,
      [f.fromDate, f.toDate, ...sub.params]
    );
    return rows;
  },

  /** Last 12 months successful payment totals (chart). */
  async revenueTrendByMonth(f: ResolvedReportFilters): Promise<RowDataPacket[]> {
    const sub = subscriptionClauses(f);
    const pay = paymentExtraClause(f);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(p.payment_date, '%Y-%m') AS ym, COALESCE(SUM(p.amount), 0) AS revenue
       FROM payments p
       INNER JOIN invoices i ON i.invoice_id = p.invoice_id
       INNER JOIN subscriptions s ON s.subscription_id = i.subscription_id
       WHERE p.payment_status = 'SUCCESS'
         AND p.payment_date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 11 MONTH), '%Y-%m-01')${sub.sql}${pay.sql}
       GROUP BY ym
       ORDER BY ym`,
      [...sub.params, ...pay.params]
    );
    return rows;
  },

  async overdueTrendByMonth(f: ResolvedReportFilters): Promise<RowDataPacket[]> {
    const sub = subscriptionClauses(f);
    const inv = invoiceExtraClause(f);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(i.due_date, '%Y-%m') AS ym,
              COALESCE(SUM(i.total_amount), 0) AS overdue_amount,
              COUNT(*) AS cnt
       FROM invoices i
       INNER JOIN subscriptions s ON s.subscription_id = i.subscription_id
       WHERE i.status IN ('DRAFT', 'CONFIRMED')
         AND i.due_date IS NOT NULL
         AND i.due_date < CURDATE()
         AND i.due_date >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH)${sub.sql}${inv.sql}
       GROUP BY ym
       ORDER BY ym`,
      [...sub.params, ...inv.params]
    );
    return rows;
  },

  async invoicedByMonth(f: ResolvedReportFilters): Promise<RowDataPacket[]> {
    const sub = subscriptionClauses(f);
    const inv = invoiceExtraClause(f);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(i.invoice_date, '%Y-%m') AS ym, COALESCE(SUM(i.total_amount), 0) AS total
       FROM invoices i
       INNER JOIN subscriptions s ON s.subscription_id = i.subscription_id
       WHERE DATE(i.invoice_date) BETWEEN ? AND ?${sub.sql}${inv.sql}
       GROUP BY ym
       ORDER BY ym`,
      [f.fromDate, f.toDate, ...sub.params, ...inv.params]
    );
    return rows;
  },

  async paidByMonth(f: ResolvedReportFilters): Promise<RowDataPacket[]> {
    const sub = subscriptionClauses(f);
    const pay = paymentExtraClause(f);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(p.payment_date, '%Y-%m') AS ym, COALESCE(SUM(p.amount), 0) AS total
       FROM payments p
       INNER JOIN invoices i ON i.invoice_id = p.invoice_id
       INNER JOIN subscriptions s ON s.subscription_id = i.subscription_id
       WHERE p.payment_status = 'SUCCESS'
         AND DATE(p.payment_date) BETWEEN ? AND ?${sub.sql}${pay.sql}
       GROUP BY ym
       ORDER BY ym`,
      [f.fromDate, f.toDate, ...sub.params, ...pay.params]
    );
    return rows;
  },

  async activeSubscriptionsRows(f: ResolvedReportFilters): Promise<RowDataPacket[]> {
    const sub = subscriptionClauses(f);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         COALESCE(s.subscription_number, CONCAT('SO', s.subscription_id)) AS subscription_number,
         c.customer_name,
         rp.plan_name,
         DATE_FORMAT(s.start_date, '%Y-%m-%d') AS start_date,
         DATE_FORMAT(s.expiration_date, '%Y-%m-%d') AS expiration_date,
         s.status,
         s.total_amount
       FROM subscriptions s
       LEFT JOIN customers c ON c.customer_id = s.customer_id
       LEFT JOIN recurring_plans rp ON rp.plan_id = s.plan_id
       WHERE s.status = 'ACTIVE'${sub.sql}
       ORDER BY s.subscription_id DESC
       LIMIT 300`,
      sub.params
    );
    return rows;
  },

  async paymentsReportRows(f: ResolvedReportFilters): Promise<RowDataPacket[]> {
    const sub = subscriptionClauses(f);
    const pay = paymentExtraClause(f);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         DATE_FORMAT(p.payment_date, '%Y-%m-%d') AS payment_date,
         c.customer_name,
         i.invoice_number,
         p.payment_method,
         p.amount,
         p.payment_status
       FROM payments p
       INNER JOIN invoices i ON i.invoice_id = p.invoice_id
       INNER JOIN customers c ON c.customer_id = p.customer_id
       INNER JOIN subscriptions s ON s.subscription_id = i.subscription_id
       WHERE DATE(p.payment_date) BETWEEN ? AND ?${sub.sql}${pay.sql}
       ORDER BY p.payment_id DESC
       LIMIT 500`,
      [f.fromDate, f.toDate, ...sub.params, ...pay.params]
    );
    return rows;
  },

  async overdueInvoicesRows(f: ResolvedReportFilters): Promise<RowDataPacket[]> {
    const sub = subscriptionClauses(f);
    const inv = invoiceExtraClause(f);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         i.invoice_number,
         c.customer_name,
         DATE_FORMAT(i.due_date, '%Y-%m-%d') AS due_date,
         i.total_amount AS due_amount,
         DATEDIFF(CURDATE(), i.due_date) AS days_overdue,
         i.status AS invoice_status
       FROM invoices i
       INNER JOIN customers c ON c.customer_id = i.customer_id
       INNER JOIN subscriptions s ON s.subscription_id = i.subscription_id
       WHERE i.status IN ('DRAFT', 'CONFIRMED')
         AND i.due_date IS NOT NULL
         AND i.due_date < CURDATE()${sub.sql}${inv.sql}
       ORDER BY i.due_date ASC
       LIMIT 300`,
      [...sub.params, ...inv.params]
    );
    return rows;
  },

  /** Legacy shape for export compatibility. */
  async activeSubscriptionsRaw(f: ResolvedReportFilters): Promise<RowDataPacket[]> {
    const sub = subscriptionClauses(f);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT s.*, c.customer_name, rp.plan_name
       FROM subscriptions s
       LEFT JOIN customers c ON c.customer_id = s.customer_id
       LEFT JOIN recurring_plans rp ON rp.plan_id = s.plan_id
       WHERE s.status = 'ACTIVE'${sub.sql}
       ORDER BY s.subscription_id DESC`,
      sub.params
    );
    return rows;
  },

  monthLabel,

  async listCustomersMeta(): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT customer_id AS id, customer_name AS label FROM customers ORDER BY customer_name ASC LIMIT 500`
    );
    return rows;
  },

  async listProductsMeta(): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT product_id AS id, product_name AS label FROM products WHERE status = 'ACTIVE' ORDER BY product_name ASC LIMIT 500`
    );
    return rows;
  },

  async listPlansMeta(): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT plan_id AS id, plan_name AS label FROM recurring_plans WHERE status = 'ACTIVE' ORDER BY plan_name ASC LIMIT 200`
    );
    return rows;
  },
};
