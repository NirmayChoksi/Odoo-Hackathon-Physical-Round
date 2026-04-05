export interface DiscountRow {
  discount_id: number;
  discount_name: string;
  coupon_code: string | null;
  discount_type: 'FIXED' | 'PERCENTAGE';
  discount_value: number;
  minimum_purchase: number;
  minimum_quantity: number;
  start_date: string | null;
  end_date: string | null;
  limit_usage: number | null;
  used_count: number;
  created_by: number | null;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  created_at: Date;
  updated_at: Date;
}

export interface DiscountListQuery {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}

export interface CreateDiscountBody {
  discountName: string;
  couponCode?: string;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountValue: number;
  minimumPurchase?: number;
  minimumQuantity?: number;
  startDate?: string;
  endDate?: string;
  limitUsage?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
}

export type PatchDiscountBody = Partial<Omit<CreateDiscountBody, "couponCode" | "limitUsage">> & {
  /** Explicit null clears coupon in DB (avoids UNIQUE("") collisions). */
  couponCode?: string | null;
  /** Explicit null clears usage cap in DB. */
  limitUsage?: number | null;
};
