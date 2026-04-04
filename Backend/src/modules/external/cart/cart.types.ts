export interface AddCartItemBody {
  productId: number;
  planId: number;
  variantId?: number | null;
  quantity: number;
}

export interface UpdateCartItemBody {
  quantity: number;
}

export interface CartItemRow {
  cart_item_id: number;
  cart_id: number;
  product_id: number;
  plan_id: number;
  variant_id: number | null;
  quantity: number;
  unit_price: string;
  total_price: string;
  product_name?: string;
  plan_name?: string;
  billing_period?: string;
}
