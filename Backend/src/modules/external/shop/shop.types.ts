export type BillingPeriod = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export interface ShopListQuery {
  page: number;
  limit: number;
  search?: string;
  productType?: string;
  minPrice?: number;
  maxPrice?: number;
  billingPeriod?: BillingPeriod;
  sortBy: "product_name" | "price" | "created_at";
  sortOrder: "asc" | "desc";
}

export interface ShopProduct {
  product_id: number;
  product_name: string;
  product_type: string;
  sales_price: string;
  short_description: string | null;
  image_url: string | null;
  description: string | null;
  default_plan_id: number | null;
  default_plan_name: string | null;
  plan_price: string | null;
  billing_period: string | null;
  display_price: string;
  created_at: Date;
}

export interface ShopFilters {
  productTypes: string[];
  priceRange: { min: number; max: number };
  billingPeriods: string[];
}

export interface ProductPlan {
  product_plan_id: number;
  plan_id: number;
  plan_name: string;
  price: string;
  billing_period: string;
  is_default: boolean;
}

export interface ShopProductDetail extends ShopProduct {
  terms_and_conditions: string | null;
  variants: Array<{
    variant_id: number;
    attribute_name: string;
    attribute_value: string;
    extra_price: string;
    status: string;
  }>;
}
