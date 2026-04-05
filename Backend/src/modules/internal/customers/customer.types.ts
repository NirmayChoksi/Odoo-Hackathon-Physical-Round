export interface CustomerListQuery {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}

export interface CreateCustomerBody {
  customerName: string;
  email?: string;
  phone?: string;
  companyName?: string;
  billingAddress?: string;
  shippingAddress?: string;
  taxNumber?: string;
  portalUserId?: number | null;
  status?: string;
}

export interface PatchCustomerBody extends Partial<CreateCustomerBody> {}
