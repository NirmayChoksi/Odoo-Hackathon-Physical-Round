export interface SubscriptionListQuery {
  page: number;
  limit: number;
  status?: string;
  customerId?: number;
  search?: string;
}

export interface CreateSubscriptionBody {
  customerId: number;
  planId: number;
  templateId?: number | null;
  status?: string;
  startDate?: string;
}

export interface PatchSubscriptionBody {
  planId?: number;
  templateId?: number | null;
  expirationDate?: string | null;
  paymentTerms?: string | null;
}

export interface PatchSubscriptionStatusBody {
  status: string;
}

export interface CreateSubscriptionItemBody {
  productId: number;
  variantId?: number | null;
  quantity: number;
  unitPrice: number;
  taxId?: number | null;
  discountId?: number | null;
}

export interface PatchSubscriptionItemBody extends Partial<CreateSubscriptionItemBody> {}
