export interface PaymentListQuery {
  page: number;
  limit: number;
  invoiceId?: number;
  status?: string;
}

export interface RecordPaymentBody {
  invoiceId: number;
  customerId: number;
  paymentMethod: string;
  amount: number;
}
