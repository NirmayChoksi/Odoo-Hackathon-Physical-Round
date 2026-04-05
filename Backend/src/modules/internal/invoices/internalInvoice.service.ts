import { fail } from "../../../utils/apiResponse";
import { subscriptionRepository } from "../subscriptions/subscription.repository";
import { internalInvoiceRepository } from "./internalInvoice.repository";
import type { CreateInternalInvoiceBody, InternalInvoiceListQuery } from "./internalInvoice.types";

export const internalInvoiceService = {
  async list(q: InternalInvoiceListQuery) {
    const { rows, total } = await internalInvoiceRepository.list(q);
    return {
      invoices: rows,
      pagination: {
        page: q.page,
        limit: q.limit,
        total,
        totalPages: Math.ceil(total / q.limit) || 0
      }
    };
  },

  async getDetail(invoiceId: number) {
    const inv = await internalInvoiceRepository.getById(invoiceId);
    if (!inv) throw fail("Invoice not found", 404);
    const items = await internalInvoiceRepository.listItems(invoiceId);
    return { ...inv, items };
  },

  async createFromSubscription(body: CreateInternalInvoiceBody) {
    const r = await subscriptionRepository.generateInvoiceFromSubscription(body.subscriptionId);
    return this.getDetail(r.invoiceId);
  },

  async confirm(invoiceId: number) {
    const inv = await internalInvoiceRepository.getById(invoiceId);
    if (!inv) throw fail("Invoice not found", 404);
    if (inv.status === "PAID" || inv.status === "CANCELLED") {
      throw fail("Cannot confirm invoice in current status", 400);
    }
    await internalInvoiceRepository.setStatus(invoiceId, "CONFIRMED");
    return this.getDetail(invoiceId);
  },

  async cancel(invoiceId: number) {
    const inv = await internalInvoiceRepository.getById(invoiceId);
    if (!inv) throw fail("Invoice not found", 404);
    if (inv.status === "PAID") throw fail("Cannot cancel a paid invoice", 400);
    await internalInvoiceRepository.setStatus(invoiceId, "CANCELLED");
    return this.getDetail(invoiceId);
  },

  async send(invoiceId: number) {
    const inv = await internalInvoiceRepository.getById(invoiceId);
    if (!inv) throw fail("Invoice not found", 404);
    await internalInvoiceRepository.appendNote(invoiceId, `[sent] ${new Date().toISOString()}`);
    return { invoice_id: invoiceId, sent: true };
  },

  async print(invoiceId: number) {
    const data = await this.getDetail(invoiceId);
    return { ...data, print: true };
  }
};
