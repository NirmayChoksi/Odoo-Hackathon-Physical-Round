import { inject, isDevMode } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { updateState, withDevtools, withDevToolsStub } from '@angular-architects/ngrx-toolkit';
import { signalStore, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import {
  OrdersApiService,
  type OrderListItem,
  type OrderDetail,
  type OrderInvoice,
  type OrderListQuery,
} from './orders-api.service';

type OrdersState = {
  orders: OrderListItem[];
  currentOrder: OrderDetail | null;
  invoices: OrderInvoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  isLoading: boolean;
  isActionLoading: boolean;
  error: string | null;
};

const initialState: OrdersState = {
  orders: [],
  currentOrder: null,
  invoices: [],
  pagination: null,
  isLoading: false,
  isActionLoading: false,
  error: null,
};

const devtools = isDevMode()
  ? withDevtools('orders')
  : withDevToolsStub('orders');

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    return err.error?.error || err.error?.message || err.error || err.message || fallback;
  }
  return fallback;
}

export const OrdersStore = signalStore(
  { providedIn: 'root' },
  devtools,
  withState(initialState),
  withMethods((store, api = inject(OrdersApiService)) => ({

    // ─── List ────────────────────────────────────────────────────────────────

    async loadAll(query: OrderListQuery = {}): Promise<void> {
      updateState(store, '[Orders] Load All', { isLoading: true, error: null });
      try {
        const response = await firstValueFrom(api.list(query));
        if (response.success) {
          updateState(store, '[Orders] Load All Success', {
            orders: response.data.orders,
            pagination: response.data.pagination,
            isLoading: false,
          });
        }
      } catch (err) {
        updateState(store, '[Orders] Load All Failure', {
          error: extractErrorMessage(err, 'Failed to load orders'),
          isLoading: false,
        });
      }
    },

    // ─── Detail ──────────────────────────────────────────────────────────────

    async loadDetail(orderNumber: string): Promise<{ success: boolean; error?: string }> {
      updateState(store, '[Orders] Load Detail', { isLoading: true, error: null });
      try {
        const response = await firstValueFrom(api.detail(orderNumber));
        if (response.success) {
          updateState(store, '[Orders] Load Detail Success', {
            currentOrder: response.data,
            isLoading: false,
          });
          return { success: true };
        }
        return { success: false, error: 'Failed to load order detail' };
      } catch (err) {
        const error = extractErrorMessage(err, 'Failed to load order detail');
        updateState(store, '[Orders] Load Detail Failure', { error, isLoading: false });
        return { success: false, error };
      }
    },

    // ─── Invoices ────────────────────────────────────────────────────────────

    async loadInvoices(orderNumber: string): Promise<{ success: boolean; error?: string }> {
      updateState(store, '[Orders] Load Invoices', { isLoading: true, error: null });
      try {
        const response = await firstValueFrom(api.invoicesForOrder(orderNumber));
        if (response.success) {
          updateState(store, '[Orders] Load Invoices Success', {
            invoices: response.data.invoices,
            isLoading: false,
          });
          return { success: true };
        }
        return { success: false, error: 'Failed to load invoices' };
      } catch (err) {
        const error = extractErrorMessage(err, 'Failed to load invoices');
        updateState(store, '[Orders] Load Invoices Failure', { error, isLoading: false });
        return { success: false, error };
      }
    },

    // ─── Renew ───────────────────────────────────────────────────────────────

    async renew(orderNumber: string): Promise<{ success: boolean; error?: string }> {
      updateState(store, '[Orders] Renew', { isActionLoading: true, error: null });
      try {
        const response = await firstValueFrom(api.renew(orderNumber));
        updateState(store, '[Orders] Renew Success', { isActionLoading: false });
        return { success: true };
      } catch (err) {
        const error = extractErrorMessage(err, 'Failed to renew order');
        updateState(store, '[Orders] Renew Failure', { error, isActionLoading: false });
        return { success: false, error };
      }
    },

    // ─── Close ───────────────────────────────────────────────────────────────

    async close(orderNumber: string): Promise<{ success: boolean; error?: string }> {
      updateState(store, '[Orders] Close', { isActionLoading: true, error: null });
      try {
        const response = await firstValueFrom(api.close(orderNumber));
        if (response.success) {
          // Update current order status locally if loaded
          const current = store.currentOrder();
          if (current && current.order_number === orderNumber) {
            updateState(store, '[Orders] Close Success - Update Local', {
              currentOrder: { ...current, status: 'CLOSED' },
            });
          }
        }
        updateState(store, '[Orders] Close Success', { isActionLoading: false });
        return { success: true };
      } catch (err) {
        const error = extractErrorMessage(err, 'Failed to close order');
        updateState(store, '[Orders] Close Failure', { error, isActionLoading: false });
        return { success: false, error };
      }
    },

    // ─── Pay ─────────────────────────────────────────────────────────────────

    async pay(orderNumber: string, paymentMethod: string): Promise<{ success: boolean; error?: string }> {
      updateState(store, '[Orders] Pay', { isActionLoading: true, error: null });
      try {
        await firstValueFrom(api.pay(orderNumber, paymentMethod));
        updateState(store, '[Orders] Pay Success', { isActionLoading: false });
        return { success: true };
      } catch (err) {
        const error = extractErrorMessage(err, 'Failed to process payment');
        updateState(store, '[Orders] Pay Failure', { error, isActionLoading: false });
        return { success: false, error };
      }
    },

    // ─── Helpers ─────────────────────────────────────────────────────────────

    resetCurrentOrder(): void {
      updateState(store, '[Orders] Reset Current', { currentOrder: null, invoices: [] });
    },

    clearError(): void {
      updateState(store, '[Orders] Clear Error', { error: null });
    },
  }))
);
