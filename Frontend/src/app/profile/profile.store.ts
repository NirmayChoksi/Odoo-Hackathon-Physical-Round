import { computed, inject, isDevMode } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { updateState, withDevtools, withDevToolsStub } from '@angular-architects/ngrx-toolkit';
import { signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';

import { AuthStore } from '../auth/auth.store';

export type ProfileApiSuccess<T> = { success: true; message: string; data: T };

export interface ProfileDto {
  user_id: number;
  full_name: string;
  email: string;
  phone: string | null;
  role_id: number;
  status: string;
  created_at: string;
}

export interface ProfileAddressRow {
  address_id: number;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: number;
}

type ProfileState = {
  profile: ProfileDto | null;
  addresses: ProfileAddressRow[];
  /** API prefix used for the cached row (`/api/external/profile` or `/api/internal/profile`). */
  apiBase: string | null;
  isLoading: boolean;
  isSaving: boolean;
  loadError: string | null;
  saveError: string | null;
};

const initialState: ProfileState = {
  profile: null,
  addresses: [],
  apiBase: null,
  isLoading: false,
  isSaving: false,
  loadError: null,
  saveError: null,
};

function httpErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    return err.error?.error || err.error?.message || err.error || err.message || 'Request failed';
  }
  return 'Request failed';
}

function formatPrimaryAddress(rows: ProfileAddressRow[]): string {
  if (!rows?.length) return 'No address on file';
  const pick = rows.find((r) => r.is_default) ?? rows[0];
  const line2 = pick.address_line2?.trim();
  const cityLine = [pick.city, pick.state, pick.postal_code].filter(Boolean).join(', ');
  const parts = [pick.address_line1, line2, cityLine, pick.country].filter(Boolean);
  return parts.join(' · ');
}

const profileDevtools = isDevMode() ? withDevtools('profile') : withDevToolsStub('profile');

export const ProfileStore = signalStore(
  { providedIn: 'root' },
  profileDevtools,
  withState(initialState),
  withComputed(({ addresses }) => ({
    addressSummary: computed(() => formatPrimaryAddress(addresses())),
  })),
  withMethods((store, http = inject(HttpClient), auth = inject(AuthStore)) => ({
    /** Clears cached profile (e.g. after logout from another flow). */
    reset() {
      updateState(store, '[Profile] Reset', { ...initialState });
    },

    clearSaveError() {
      updateState(store, '[Profile] Clear Save Error', { saveError: null });
    },

    async loadProfile(apiBase: string): Promise<{ success: boolean; error?: string }> {
      updateState(store, '[Profile] Load', {
        isLoading: true,
        loadError: null,
      });
      try {
        const [profileRes, addrRes] = await Promise.all([
          firstValueFrom(http.get<ProfileApiSuccess<ProfileDto>>(apiBase)),
          firstValueFrom(
            http.get<ProfileApiSuccess<{ addresses: ProfileAddressRow[] }>>(`${apiBase}/addresses`),
          ),
        ]);
        updateState(store, '[Profile] Load Success', {
          profile: profileRes.data,
          addresses: addrRes.data.addresses,
          apiBase,
          isLoading: false,
          loadError: null,
        });
        return { success: true };
      } catch (err) {
        const errorMsg = httpErrorMessage(err);
        updateState(store, '[Profile] Load Failure', {
          isLoading: false,
          loadError: errorMsg,
        });
        return { success: false, error: errorMsg };
      }
    },

    async updateProfile(
      apiBase: string,
      body: { fullName: string; email: string; phone: string },
    ): Promise<{ success: boolean; error?: string }> {
      updateState(store, '[Profile] Update', { isSaving: true, saveError: null });
      try {
        const res = await firstValueFrom(
          http.patch<ProfileApiSuccess<ProfileDto>>(apiBase, {
            fullName: body.fullName,
            email: body.email,
            phone: body.phone.trim() || '',
          }),
        );
        const d = res.data;
        auth.syncUserFromProfile({ full_name: d.full_name, email: d.email });
        updateState(store, '[Profile] Update Success', {
          profile: d,
          apiBase,
          isSaving: false,
          saveError: null,
        });
        return { success: true };
      } catch (err) {
        const errorMsg = httpErrorMessage(err);
        updateState(store, '[Profile] Update Failure', {
          isSaving: false,
          saveError: errorMsg,
        });
        return { success: false, error: errorMsg };
      }
    },

    async addAddress(
      apiBase: string,
      body: {
        fullName: string;
        phone: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        isDefault: boolean;
      }
    ): Promise<{ success: boolean; error?: string }> {
      updateState(store, '[Profile] Add Address Loading', { isSaving: true, saveError: null });
      try {
        await firstValueFrom(
          http.post(`${apiBase}/addresses`, body)
        );
        // Refresh profile to get the new address list
        await this.loadProfile(apiBase);
        
        updateState(store, '[Profile] Add Address Success', { isSaving: false });
        return { success: true };
      } catch (err) {
        const errorMsg = httpErrorMessage(err);
        updateState(store, '[Profile] Add Address Failure', {
          isSaving: false,
          saveError: errorMsg,
        });
        return { success: false, error: errorMsg };
      }
    },

    async updateAddress(
      apiBase: string,
      addressId: number,
      body: Partial<{
        fullName: string;
        phone: string;
        addressLine1: string;
        addressLine2: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        isDefault: boolean;
      }>
    ): Promise<{ success: boolean; error?: string }> {
      updateState(store, '[Profile] Update Address Loading', { isSaving: true, saveError: null });
      try {
        await firstValueFrom(
          http.patch(`${apiBase}/addresses/${addressId}`, body)
        );
        await this.loadProfile(apiBase);
        updateState(store, '[Profile] Update Address Success', { isSaving: false });
        return { success: true };
      } catch (err) {
        const errorMsg = httpErrorMessage(err);
        updateState(store, '[Profile] Update Address Failure', {
          isSaving: false,
          saveError: errorMsg,
        });
        return { success: false, error: errorMsg };
      }
    },

    async deleteAddress(
      apiBase: string,
      addressId: number
    ): Promise<{ success: boolean; error?: string }> {
      updateState(store, '[Profile] Delete Address Loading', { isSaving: true, saveError: null });
      try {
        await firstValueFrom(
          http.delete(`${apiBase}/addresses/${addressId}`)
        );
        await this.loadProfile(apiBase);
        updateState(store, '[Profile] Delete Address Success', { isSaving: false });
        return { success: true };
      } catch (err) {
        const errorMsg = httpErrorMessage(err);
        updateState(store, '[Profile] Delete Address Failure', {
          isSaving: false,
          saveError: errorMsg,
        });
        return { success: false, error: errorMsg };
      }
    },

    async setDefaultAddress(
      apiBase: string,
      addressId: number
    ): Promise<{ success: boolean; error?: string }> {
      updateState(store, '[Profile] Set Default Address Loading', { isSaving: true, saveError: null });
      try {
        await firstValueFrom(
          http.post(`${apiBase}/addresses/${addressId}/default`, {})
        );
        await this.loadProfile(apiBase);
        updateState(store, '[Profile] Set Default Address Success', { isSaving: false });
        return { success: true };
      } catch (err) {
        const errorMsg = httpErrorMessage(err);
        updateState(store, '[Profile] Set Default Address Failure', {
          isSaving: false,
          saveError: errorMsg,
        });
        return { success: false, error: errorMsg };
      }
    },
  })),
);
