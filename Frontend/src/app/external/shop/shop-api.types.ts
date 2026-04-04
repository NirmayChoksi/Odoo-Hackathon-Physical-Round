/** Backend `/api/external/shop` — aligns with `Backend/.../shop.controller.ts` + `apiResponse.success`. */

export const SHOP_API_BASE = '/api/external/shop';

export interface ShopApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ShopFiltersData {
  productTypes: string[];
  categories: string[];
  priceRange: { min: number; max: number };
  billingPeriods: string[];
}

export type ShopFiltersResponse = ShopApiEnvelope<ShopFiltersData>;

export interface ShopProductRow {
  product_id: number;
  product_name: string;
  product_type: string;
  sales_price: string;
  short_description: string | null;
  image_urls: string[] | null;
  description: string | null;
  default_plan_id: number | null;
  default_plan_name: string | null;
  plan_price: string | null;
  billing_period: string | null;
  display_price: string;
  created_at: string;
}

export interface ShopListData {
  products: ShopProductRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type ShopListResponse = ShopApiEnvelope<ShopListData>;

export type ShopSortByApi = 'product_name' | 'price' | 'created_at';
export type ShopSortOrderApi = 'asc' | 'desc';

export interface ShopListQueryParams {
  page: number;
  limit: number;
  search?: string;
  productType?: string;
  minPrice?: number;
  maxPrice?: number;
  billingPeriod?: string;
  sortBy: ShopSortByApi;
  sortOrder: ShopSortOrderApi;
}

/** Normalized row for the storefront grid. */
export interface ShopProductCard {
  id: number;
  name: string;
  category: string;
  description: string;
  images: string[];
  displayPrice: number;
  billingPeriodLabel: string | null;
  planName: string | null;
}

export const SHOP_PLACEHOLDER_IMAGE =
  'https://placehold.co/600x400/e2e8f0/64748b?text=Product';

export function toShopProductCard(row: ShopProductRow): ShopProductCard {
  const display = Number.parseFloat(String(row.display_price));
  const fallback = Number.parseFloat(String(row.sales_price));
  const price = Number.isFinite(display) ? display : Number.isFinite(fallback) ? fallback : 0;
  const img = row.image_urls ? row.image_urls : [SHOP_PLACEHOLDER_IMAGE];
  return {
    id: row.product_id,
    name: row.product_name,
    category: row.product_type,
    description: row.short_description?.trim() || row.description?.trim() || '',
    images: img,
    displayPrice: price,
    billingPeriodLabel: row.billing_period,
    planName: row.default_plan_name,
  };
}
