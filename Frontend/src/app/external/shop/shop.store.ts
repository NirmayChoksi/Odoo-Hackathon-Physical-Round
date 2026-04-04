import { computed, DestroyRef, inject, isDevMode } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { updateState, withDevtools, withDevToolsStub } from '@angular-architects/ngrx-toolkit';
import { signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';

import type {
  ShopFiltersResponse,
  ShopListResponse,
  ShopProductCard,
  ShopSortByApi,
  ShopSortOrderApi,
} from './shop-api.types';
import { SHOP_API_BASE, toShopProductCard } from './shop-api.types';

export type ShopSortUi = 'default' | 'price-asc' | 'price-desc' | 'name';

type ShopState = {
  categories: string[];
  rangeMin: number;
  rangeMax: number;
  products: ShopProductCard[];
  totalProducts: number;
  totalPages: number;
  page: number;
  pageSize: number;
  filtersError: string | null;
  listError: string | null;
  isListingLoading: boolean;
  searchQuery: string;
  selectedCategory: string;
  minPrice: number;
  maxPrice: number;
  sortBy: ShopSortUi;
};

const initialState: ShopState = {
  categories: ['All'],
  rangeMin: 0,
  rangeMax: 5000,
  products: [],
  totalProducts: 0,
  totalPages: 0,
  page: 1,
  pageSize: 12,
  filtersError: null,
  listError: null,
  isListingLoading: false,
  searchQuery: '',
  selectedCategory: 'All',
  minPrice: 0,
  maxPrice: 5000,
  sortBy: 'default',
};

function httpErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    return (
      err.error?.message ||
      err.error?.error ||
      (typeof err.error === 'string' ? err.error : null) ||
      err.message ||
      'Request failed'
    );
  }
  return err instanceof Error ? err.message : 'Request failed';
}

function sortApiFromUi(sortBy: ShopSortUi): { sortBy: ShopSortByApi; sortOrder: ShopSortOrderApi } {
  switch (sortBy) {
    case 'price-asc':
      return { sortBy: 'price', sortOrder: 'asc' };
    case 'price-desc':
      return { sortBy: 'price', sortOrder: 'desc' };
    case 'name':
      return { sortBy: 'product_name', sortOrder: 'asc' };
    default:
      return { sortBy: 'created_at', sortOrder: 'desc' };
  }
}

const shopDevtools = isDevMode() ? withDevtools('shop') : withDevToolsStub('shop');

export const ShopStore = signalStore(
  { providedIn: 'root' },
  shopDevtools,
  withState(initialState),
  withComputed(({ page, pageSize, totalProducts }) => ({
    rangeStart: computed(() => {
      const t = totalProducts();
      if (t === 0) return 0;
      return (page() - 1) * pageSize() + 1;
    }),
    rangeEnd: computed(() => Math.min(page() * pageSize(), totalProducts())),
  })),
  withMethods((store, http = inject(HttpClient), destroyRef = inject(DestroyRef)) => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const DEBOUNCE_MS = 380;

    destroyRef.onDestroy(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
    });

    const loadProducts = async (): Promise<void> => {
      updateState(store, '[Shop] List Start', { isListingLoading: true, listError: null });
      try {
        const sort = sortApiFromUi(store.sortBy());
        let params = new HttpParams()
          .set('page', String(store.page()))
          .set('limit', String(store.pageSize()));
        const s = store.searchQuery().trim();
        if (s) params = params.set('search', s);
        const pt = store.selectedCategory();
        if (pt !== 'All') params = params.set('productType', pt);
        params = params.set('minPrice', String(store.minPrice())).set('maxPrice', String(store.maxPrice()));
        params = params.set('sortBy', sort.sortBy).set('sortOrder', sort.sortOrder);

        const res = await firstValueFrom(
          http.get<ShopListResponse>(`${SHOP_API_BASE}/products`, { params }),
        );
        if (!res?.success || res.data == null) {
          throw new Error(res?.message || 'Failed to load products');
        }
        const data = res.data;
        updateState(store, '[Shop] List Success', {
          products: data.products.map(toShopProductCard),
          totalProducts: data.pagination.total,
          totalPages: data.pagination.totalPages,
          isListingLoading: false,
          listError: null,
        });
      } catch (e) {
        updateState(store, '[Shop] List Failure', {
          listError: httpErrorMessage(e),
          products: [],
          totalProducts: 0,
          totalPages: 0,
          isListingLoading: false,
        });
      }
    };

    const queueListReload = (resetPage: boolean): void => {
      if (resetPage) {
        updateState(store, '[Shop] Page Reset (debounced)', { page: 1 });
      }
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        void loadProducts();
      }, DEBOUNCE_MS);
    };

    return {
      /** Load filter metadata then first product page (call from shop route). */
      async initializeShop(): Promise<void> {
        updateState(store, '[Shop] Filters Start', { filtersError: null });
        try {
          const res = await firstValueFrom(http.get<ShopFiltersResponse>(`${SHOP_API_BASE}/filters`));
          if (!res?.success || res.data == null) {
            throw new Error(res?.message || 'Failed to load shop filters');
          }
          const f = res.data;
          const types = f.categories?.length ? f.categories : f.productTypes;
          const categories = ['All', ...(types ?? [])];
          const pr = f.priceRange;
          let rangeMin = 0;
          let rangeMax = 5000;
          let minPrice = 0;
          let maxPrice = 5000;
          if (pr && Number.isFinite(pr.max)) {
            const lo = Math.max(0, Number(pr.min) || 0);
            const hi = Math.max(lo, Number(pr.max) || 0);
            rangeMin = lo;
            rangeMax = hi || 5000;
            minPrice = lo;
            maxPrice = hi || 5000;
          }
          updateState(store, '[Shop] Filters Success', {
            categories,
            rangeMin,
            rangeMax,
            minPrice,
            maxPrice,
            filtersError: null,
          });
        } catch (e) {
          updateState(store, '[Shop] Filters Failure', {
            filtersError: httpErrorMessage(e),
            categories: ['All'],
          });
        }
        await loadProducts();
      },

      loadProducts,

      setSearchQueryFromInput(value: string): void {
        updateState(store, '[Shop] Search Query', { searchQuery: value });
        queueListReload(true);
      },

      setMinPrice(value: number): void {
        updateState(store, '[Shop] Min Price', { minPrice: value });
        queueListReload(true);
      },

      setMaxPrice(value: number): void {
        updateState(store, '[Shop] Max Price', { maxPrice: value });
        queueListReload(true);
      },

      selectCategory(category: string): void {
        updateState(store, '[Shop] Category', { selectedCategory: category, page: 1 });
        void loadProducts();
      },

      resetSearch(): void {
        updateState(store, '[Shop] Search Clear', { searchQuery: '', page: 1 });
        void loadProducts();
      },

      setSortBy(value: ShopSortUi): void {
        updateState(store, '[Shop] Sort', { sortBy: value, page: 1 });
        void loadProducts();
      },

      resetFilters(): void {
        const lo = store.rangeMin();
        const hi = store.rangeMax();
        updateState(store, '[Shop] Reset Filters', {
          searchQuery: '',
          selectedCategory: 'All',
          minPrice: lo,
          maxPrice: hi,
          sortBy: 'default',
          page: 1,
        });
        void loadProducts();
      },

      prevPage(): void {
        if (store.page() <= 1) return;
        updateState(store, '[Shop] Prev Page', { page: store.page() - 1 });
        void loadProducts();
      },

      nextPage(): void {
        if (store.page() >= store.totalPages()) return;
        updateState(store, '[Shop] Next Page', { page: store.page() + 1 });
        void loadProducts();
      },

      /** Reset to initial slice (e.g. tests or future logout flows). */
      reset(): void {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = null;
        updateState(store, '[Shop] Reset', { ...initialState });
      },
    };
  }),
);
