import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { signalStore, withMethods, withState } from '@ngrx/signals';
import { updateState } from '@angular-architects/ngrx-toolkit';
import { firstValueFrom } from 'rxjs';

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ProductVariant {
  variant_id: number;
  attribute_name: string;
  attribute_value: string;
  extra_price: string;
  status: string;
}

export interface ProductPlan {
  product_plan_id: number;
  plan_id: number;
  plan_name: string;
  price: string;
  billing_period: string;
  is_default: boolean;
}

export interface ShopProductDetail {
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
  created_at: string;
  terms_and_conditions: string | null;
  variants: ProductVariant[]; // Embedded by the /products/:id endpoint
}

const PLACEHOLDER_IMG = 'https://placehold.co/600x400/e2e8f0/64748b?text=Product';

type ProductState = {
  product: ShopProductDetail | null;
  plans: ProductPlan[];
  variants: ProductVariant[];
  images: string[];
  isLoading: boolean;
  loadError: string | null;
};

const initialState: ProductState = {
  product: null,
  plans: [],
  variants: [],
  images: [],
  isLoading: false,
  loadError: null,
};

function httpErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    return err.error?.error || err.error?.message || err.error || err.message || 'Request failed';
  }
  return 'Request failed';
}

export const ProductStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, http = inject(HttpClient)) => ({
    async loadProduct(apiBase: string, productId: number): Promise<{ success: boolean; error?: string }> {
      updateState(store, '[Product] Load', {
        isLoading: true,
        loadError: null,
      });

      try {
        // Fetch product detail + plans + images concurrently.
        // Variants are already embedded inside the /products/:id response.
        const [prodReq, plansReq, imagesReq] = await Promise.all([
          firstValueFrom(http.get<ApiSuccess<ShopProductDetail>>(`${apiBase}/products/${productId}`)),
          firstValueFrom(http.get<ApiSuccess<{ product_id: number; plans: ProductPlan[] }>>(`${apiBase}/products/${productId}/plans`)),
          firstValueFrom(http.get<ApiSuccess<{ product_id: number; images: { image_url: string; sort_order: number }[] }>>(`${apiBase}/products/${productId}/images`)),
        ]);

        const product = prodReq.data;

        // images endpoint returns [{image_url, sort_order}]; extract URL strings.
        // Fall back to product.image_url, then placeholder.
        const rawImgs = (imagesReq.data.images || [])
          .map(i => i.image_url)
          .filter((u): u is string => !!u);
        const images = rawImgs.length > 0
          ? rawImgs
          : product.image_url
            ? [product.image_url]
            : [PLACEHOLDER_IMG];

        updateState(store, '[Product] Load Success', {
          product,
          plans: plansReq.data.plans || [],
          variants: product.variants || [],  // embedded in product detail
          images,
          isLoading: false,
          loadError: null,
        });
        return { success: true };
      } catch (err) {
        const errorMsg = httpErrorMessage(err);
        updateState(store, '[Product] Load Failure', {
          isLoading: false,
          loadError: errorMsg,
          product: null,
          plans: [],
          variants: [],
          images: [],
        });
        return { success: false, error: errorMsg };
      }
    }
  }))
);
