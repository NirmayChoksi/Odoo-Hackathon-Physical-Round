export interface InternalInvoiceListQuery {
  page: number;
  limit: number;
  status?: string;
  customerId?: number;
}

export interface CreateInternalInvoiceBody {
  subscriptionId: number;
}
