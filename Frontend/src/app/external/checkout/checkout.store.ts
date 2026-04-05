import { inject, isDevMode } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { updateState, withDevtools, withDevToolsStub } from '@angular-architects/ngrx-toolkit';
import { signalStore, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import {
  CheckoutApiService,
  type CheckoutAddress,
  type SaveAddressBody,
  type PlaceOrderResult,
} from './checkout-api.service';

type CheckoutState = {
  addresses: CheckoutAddress[];
  selectedAddressId: number | null;
  paymentMethod: string;
  /** Snapshot after order placed */
  placedOrder: PlaceOrderResult | null;
  isLoading: boolean;
  isPlacingOrder: boolean;
  error: string | null;
};

const initialState: CheckoutState = {
  addresses: [],
  selectedAddressId: null,
  paymentMethod: 'CARD',   // dummy default
  placedOrder: null,
  isLoading: false,
  isPlacingOrder: false,
  error: null,
};

const devtools = isDevMode()
  ? withDevtools('checkout')
  : withDevToolsStub('checkout');

function extractError(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    return err.error?.error || err.error?.message || err.error || err.message || fallback;
  }
  return fallback;
}

export const CheckoutStore = signalStore(
  { providedIn: 'root' },
  devtools,
  withState(initialState),
  withMethods((store, api = inject(CheckoutApiService)) => ({

    // ─── Load Addresses ──────────────────────────────────────────────────────

    async loadAddresses(): Promise<void> {
      updateState(store, '[Checkout] Load Addresses', { isLoading: true, error: null });
      try {
        const res = await firstValueFrom(api.listAddresses());
        const addresses = res.data.addresses ?? [];
        const defaultAddr = addresses.find(a => a.is_default);
        updateState(store, '[Checkout] Load Addresses Success', {
          addresses,
          selectedAddressId: defaultAddr?.address_id ?? (addresses[0]?.address_id ?? null),
          isLoading: false,
        });
      } catch (err) {
        updateState(store, '[Checkout] Load Addresses Failure', {
          error: extractError(err, 'Failed to load addresses'),
          isLoading: false,
        });
      }
    },

    // ─── Save New Address ────────────────────────────────────────────────────

    async saveAddress(body: SaveAddressBody): Promise<{ success: boolean; addressId?: number; error?: string }> {
      updateState(store, '[Checkout] Save Address', { isLoading: true, error: null });
      try {
        const res = await firstValueFrom(api.saveAddress(body));
        // Reload addresses list
        const listRes = await firstValueFrom(api.listAddresses());
        const addresses = listRes.data.addresses ?? [];
        updateState(store, '[Checkout] Save Address Success', {
          addresses,
          selectedAddressId: res.data.address_id,
          isLoading: false,
        });
        return { success: true, addressId: res.data.address_id };
      } catch (err) {
        const error = extractError(err, 'Failed to save address');
        updateState(store, '[Checkout] Save Address Failure', { error, isLoading: false });
        return { success: false, error };
      }
    },

    // ─── Select Address ──────────────────────────────────────────────────────

    async selectAddress(addressId: number): Promise<void> {
      updateState(store, '[Checkout] Select Address', { selectedAddressId: addressId });
      try {
        await firstValueFrom(api.selectAddress(addressId));
      } catch {
        // Non-critical — selection is tracked locally too
      }
    },

    // ─── Set Payment Method ──────────────────────────────────────────────────

    setPaymentMethod(method: string): void {
      updateState(store, '[Checkout] Set Payment Method', { paymentMethod: method });
    },

    // ─── Place Order ─────────────────────────────────────────────────────────

    async placeOrder(): Promise<{ success: boolean; order?: PlaceOrderResult; error?: string }> {
      const addressId = store.selectedAddressId();
      const paymentMethod = store.paymentMethod();

      if (!addressId) {
        return { success: false, error: 'Please select a delivery address.' };
      }

      updateState(store, '[Checkout] Place Order', { isPlacingOrder: true, error: null });
      try {
        // Save payment method first, then place order
        await firstValueFrom(api.savePaymentMethod(paymentMethod));
        const res = await firstValueFrom(api.placeOrder({ addressId, paymentMethod }));
        updateState(store, '[Checkout] Place Order Success', {
          placedOrder: res.data,
          isPlacingOrder: false,
        });
        return { success: true, order: res.data };
      } catch (err) {
        const error = extractError(err, 'Failed to place order');
        updateState(store, '[Checkout] Place Order Failure', { error, isPlacingOrder: false });
        return { success: false, error };
      }
    },

    // ─── Helpers ─────────────────────────────────────────────────────────────

    reset(): void {
      updateState(store, '[Checkout] Reset', {
        addresses: [],
        selectedAddressId: null,
        paymentMethod: 'CARD',
        placedOrder: null,
        error: null,
      });
    },

    clearError(): void {
      updateState(store, '[Checkout] Clear Error', { error: null });
    },
  }))
);
