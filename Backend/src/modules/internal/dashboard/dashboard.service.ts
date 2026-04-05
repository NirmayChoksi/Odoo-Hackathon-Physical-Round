import { dashboardRepository } from "./dashboard.repository";

export const dashboardService = {
  async summary() {
    const [active_subscriptions, total_revenue, overdue_invoices, recent_payments] = await Promise.all([
      dashboardRepository.countActiveSubscriptions(),
      dashboardRepository.sumSuccessfulPayments(),
      dashboardRepository.countOverdueInvoices(),
      dashboardRepository.recentPayments(10)
    ]);
    return {
      active_subscriptions,
      total_revenue,
      overdue_invoices,
      recent_payments
    };
  },

  async charts() {
    const [revenue_by_month, subscriptions_by_status, payments_by_status] = await Promise.all([
      dashboardRepository.revenueByMonth(12),
      dashboardRepository.subscriptionsByStatus(),
      dashboardRepository.paymentsByStatus()
    ]);
    return { revenue_by_month, subscriptions_by_status, payments_by_status };
  }
};
