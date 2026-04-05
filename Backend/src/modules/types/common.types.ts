/** Shared API / domain shapes used across external modules. */

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MoneySummary {
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
}
