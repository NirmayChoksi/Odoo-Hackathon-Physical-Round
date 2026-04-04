import type { RowDataPacket } from "mysql2";
import { pool } from "../../../config/db";
import { fail } from "../../../utils/apiResponse";
import { paymentRepository } from "./payment.repository";
import type { PaymentListQuery, RecordPaymentBody } from "./payment.types";

export const paymentService = {
  async list(q: PaymentListQuery) {
    const { rows, total } = await paymentRepository.list(q);
    return {
      payments: rows,
      pagination: {
        page: q.page,
        limit: q.limit,
        total,
        totalPages: Math.ceil(total / q.limit) || 0
      }
    };
  },

  async get(paymentId: number) {
    const row = await paymentRepository.getById(paymentId);
    if (!row) throw fail("Payment not found", 404);
    return row;
  },

  async record(body: RecordPaymentBody) {
    const [invRows] = await pool.query<RowDataPacket[]>(
      `SELECT invoice_id, status, total_amount, customer_id FROM invoices WHERE invoice_id = ? LIMIT 1`,
      [body.invoiceId]
    );
    const inv = invRows[0];
    if (!inv) throw fail("Invoice not found", 404);
    if (Number(inv.customer_id) !== body.customerId) throw fail("customerId does not match invoice", 400);
    const markPaid = inv.status !== "PAID" && Number(body.amount) >= Number(inv.total_amount);
    const paymentId = await paymentRepository.insert(
      body.invoiceId,
      body.customerId,
      body.paymentMethod,
      body.amount,
      markPaid
    );
    return paymentRepository.getById(paymentId);
  },

  async outstandingInvoices() {
    const rows = await paymentRepository.outstandingInvoices();
    return { invoices: rows };
  },

  async summary() {
    const s = await paymentRepository.summary();
    return s;
  }
};
