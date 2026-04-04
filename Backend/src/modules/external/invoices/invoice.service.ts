import { fail } from "../../../utils/apiResponse";
import { invoiceRepository } from "./invoice.repository";

export const invoiceService = {
  async getDetail(invoiceNumber: string, userId: number) {
    const inv = await invoiceRepository.getInvoiceForUser(invoiceNumber, userId);
    if (!inv) throw fail("Invoice not found", 404);
    const items = await invoiceRepository.getInvoiceItems(inv.invoice_id as number);
    const payment = await invoiceRepository.getLatestPayment(inv.invoice_id as number);
    return {
      invoice_number: inv.invoice_number,
      invoice_id: inv.invoice_id,
      status: inv.status,
      subscription_number: inv.subscription_number,
      subscription_status: inv.subscription_status,
      subtotal: inv.subtotal,
      tax_amount: inv.tax_amount,
      discount_amount: inv.discount_amount,
      total_amount: inv.total_amount,
      invoice_date: inv.invoice_date,
      due_date: inv.due_date,
      items: items.map((r) => ({
        product_id: r.product_id,
        product_name: r.product_name,
        description: r.description,
        quantity: r.quantity,
        unit_price: r.unit_price,
        line_total: r.line_total
      })),
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

  async pay(invoiceNumber: string, userId: number, paymentMethod: string) {
    const inv = await invoiceRepository.getInvoiceForUser(invoiceNumber, userId);
    if (!inv) throw fail("Invoice not found", 404);
    if (inv.status === "PAID") throw fail("Invoice already paid", 400);
    const paymentId = await invoiceRepository.recordPayment(
      inv.invoice_id as number,
      inv.customer_id as number,
      paymentMethod,
      Number(inv.total_amount)
    );
    return { payment_id: paymentId, invoice_number: invoiceNumber };
  }
};
