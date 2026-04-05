import { fail } from "../../../utils/apiResponse";
import { orderRepository } from "./order.repository";
import type { OrderListQuery } from "./order.types";

function buildDetailPayload(sub: Record<string, unknown>, items: Record<string, unknown>[]) {
  return {
    order_number: sub.subscription_number,
    subscription_id: sub.subscription_id,
    subscription_number: sub.subscription_number,
    status: sub.status,
    plan_id: sub.plan_id,
    plan_name: sub.plan_name ?? null,
    billing_period: sub.billing_period ?? null,
    plan_price: sub.plan_price ?? null,
    start_date: sub.start_date,
    expiration_date: sub.expiration_date,
    customer_name: sub.customer_name,
    subtotal: sub.subtotal,
    tax_amount: sub.tax_amount,
    discount_amount: sub.discount_amount,
    total_amount: sub.total_amount,
    items: items.map((i) => ({
      product_id: i.product_id,
      product_name: i.product_name,
      quantity: i.quantity,
      unit_price: i.unit_price,
      amount: i.amount,
      variant_id: i.variant_id
    }))
  };
}

export const orderService = {
  async list(userId: number, q: OrderListQuery) {
    const { rows, total } = await orderRepository.listOrdersForUser(userId, q);
    const orders = rows.map((s) => ({
      order_number: s.subscription_number,
      subscription_id: s.subscription_id,
      status: s.status,
      plan_name: s.plan_name,
      billing_period: s.billing_period,
      total_amount: s.total_amount,
      start_date: s.start_date,
      created_at: s.created_at
    }));
    return {
      orders,
      pagination: {
        page: q.page,
        limit: q.limit,
        total,
        totalPages: Math.ceil(total / q.limit) || 0
      }
    };
  },

  async getDetail(orderNumber: string, userId: number) {
    const sub = await orderRepository.getOrderForUser(orderNumber, userId);
    if (!sub) throw fail("Order not found", 404);

    const items = await orderRepository.getSubscriptionItems(sub.subscription_id as number);
    const invoice = await orderRepository.getInvoiceBySubscription(sub.subscription_id as number);
    let payment = null;
    if (invoice?.invoice_id) {
      payment = await orderRepository.getPaymentByInvoice(invoice.invoice_id as number);
    }

    return {
      ...buildDetailPayload(sub as Record<string, unknown>, items as Record<string, unknown>[]),
      address: null,
      invoice: invoice
        ? {
            invoice_id: invoice.invoice_id,
            invoice_number: invoice.invoice_number,
            status: invoice.status,
            subtotal: invoice.subtotal,
            tax_amount: invoice.tax_amount,
            discount_amount: invoice.discount_amount,
            total_amount: invoice.total_amount
          }
        : null,
      payment: payment
        ? {
            payment_id: payment.payment_id,
            payment_method: payment.payment_method,
            amount: payment.amount,
            payment_status: payment.payment_status,
            payment_date: payment.payment_date
          }
        : null
    };
  },

  async listInvoices(orderNumber: string, userId: number) {
    const sub = await orderRepository.getOrderForUser(orderNumber, userId);
    if (!sub) throw fail("Order not found", 404);
    const rows = await orderRepository.listInvoicesBySubscription(sub.subscription_id as number);
    return { order_number: orderNumber, invoices: rows };
  },

  async renew(orderNumber: string, userId: number) {
    try {
      return await orderRepository.renewSubscription(orderNumber, userId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === "NOT_FOUND") throw fail("Order not found", 404);
      if (msg === "CLOSED") throw fail("Cannot renew a closed subscription", 400);
      throw e;
    }
  },

  async close(orderNumber: string, userId: number) {
    const ok = await orderRepository.closeSubscription(orderNumber, userId);
    if (!ok) throw fail("Order not found", 404);
    return { closed: true, order_number: orderNumber };
  },

  async download(orderNumber: string, userId: number) {
    const data = await this.getDetail(orderNumber, userId);
    return { ...data, download: true };
  },

  async pay(orderNumber: string, userId: number, paymentMethod: string) {
    try {
      return await orderRepository.payLatestInvoice(orderNumber, userId, paymentMethod);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === "NOT_FOUND") throw fail("Order not found", 404);
      if (msg === "NO_INVOICE") throw fail("No invoice for this order", 400);
      if (msg === "ALREADY_PAID") throw fail("Already paid", 400);
      throw e;
    }
  }
};
