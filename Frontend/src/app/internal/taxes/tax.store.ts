import { computed, inject, isDevMode } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { updateState, withDevtools, withDevToolsStub } from '@angular-architects/ngrx-toolkit';
import { signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';

const API = '/api/internal/taxes';

export interface TaxRow {
  tax_id: number;
  tax_name: string;
  tax_type: string;
  tax_percentage: number;
  description: string | null;
  status?: string;
}

type ApiSuccess<T> = { success: true; message: string; data: T };

function httpErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const e = err.error;
    if (e?.errors?.length) return e.errors.join('; ');
    return e?.message || e?.error || err.message || 'Request failed';
  }
  return 'Request failed';
}

type TaxState = {
  editingTaxId: number | null;
  taxName: string;
  taxPercentage: number | null;
  description: string;
  isLoading: boolean;
  isSaving: boolean;
  loadError: string | null;
  saveError: string | null;
};

const draftDefaults: Omit<TaxState, 'isLoading' | 'isSaving' | 'loadError' | 'saveError'> = {
  editingTaxId: null,
  taxName: '',
  taxPercentage: null,
  description: '',
};

const initialState: TaxState = {
  ...draftDefaults,
  isLoading: false,
  isSaving: false,
  loadError: null,
  saveError: null,
};

const taxDevtools = isDevMode() ? withDevtools('tax') : withDevToolsStub('tax');

export const TaxStore = signalStore(
  { providedIn: 'root' },
  taxDevtools,
  withState(initialState),
  withComputed(({ editingTaxId }) => ({
    isEditMode: computed(() => editingTaxId() != null && editingTaxId()! > 0),
  })),
  withMethods((store, http = inject(HttpClient)) => {
    const clientValidationError = (): string | null => {
      const name = store.taxName().trim();
      if (!name) return 'Tax name is required.';

      const raw = store.taxPercentage();
      const pct = raw != null && Number.isFinite(Number(raw)) ? Number(raw) : NaN;
      if (!Number.isFinite(pct) || pct < 0) {
        return 'Enter a valid amount (0 or greater).';
      }

      const isNew = store.editingTaxId() == null || store.editingTaxId()! < 1;
      if (isNew && pct <= 0) {
        return 'Amount must be greater than zero for a new tax.';
      }

      if (pct > 100) {
        return 'Tax rate cannot exceed 100%.';
      }

      return null;
    };

    const applyRow = (row: TaxRow) => {
      updateState(store, '[Tax] Hydrate', {
        editingTaxId: row.tax_id,
        taxName: row.tax_name ?? '',
        taxPercentage: Number(row.tax_percentage) || 0,
        description: row.description ?? '',
        loadError: null,
        saveError: null,
      });
    };

    const resetNew = () => {
      updateState(store, '[Tax] Reset new', {
        ...draftDefaults,
        isLoading: false,
        isSaving: false,
        loadError: null,
        saveError: null,
      });
    };

    return {
      patchDraft(patch: Partial<Omit<TaxState, 'isLoading' | 'isSaving' | 'loadError' | 'saveError'>>) {
        updateState(store, '[Tax] Patch draft', patch);
      },

      resetNew,

      clearSaveError() {
        updateState(store, '[Tax] Clear save error', { saveError: null });
      },

      async loadTax(taxId: number): Promise<{ success: boolean; error?: string }> {
        updateState(store, '[Tax] Load start', { isLoading: true, loadError: null });
        try {
          const res = await firstValueFrom(http.get<ApiSuccess<TaxRow>>(`${API}/${taxId}`));
          if (!res.success || !res.data) {
            updateState(store, '[Tax] Load empty', { isLoading: false, loadError: 'Tax not found' });
            return { success: false, error: 'Tax not found' };
          }
          applyRow(res.data);
          updateState(store, '[Tax] Load done', { isLoading: false });
          return { success: true };
        } catch (e) {
          const msg = httpErrorMessage(e);
          updateState(store, '[Tax] Load error', { isLoading: false, loadError: msg });
          return { success: false, error: msg };
        }
      },

      async save(): Promise<{ success: boolean; error?: string }> {
        const vmsg = clientValidationError();
        if (vmsg) {
          updateState(store, '[Tax] Validate client', { saveError: null });
          return { success: false, error: vmsg };
        }

        const name = store.taxName().trim();
        const tp = store.taxPercentage();
        const taxPercentage = tp != null && Number.isFinite(Number(tp)) ? Number(tp) : 0;
        const desc = store.description().trim();

        const id = store.editingTaxId();
        const body: Record<string, unknown> = {
          taxName: name,
          taxType: 'PERCENTAGE',
          taxPercentage,
          status: 'ACTIVE',
        };
        if (id && id > 0) {
          body['description'] = desc || null;
        } else if (desc) {
          body['description'] = desc;
        }

        updateState(store, '[Tax] Save start', { isSaving: true, saveError: null });
        try {
          if (id && id > 0) {
            await firstValueFrom(http.patch<ApiSuccess<{ success: boolean }>>(`${API}/${id}`, body));
            const refreshed = await firstValueFrom(http.get<ApiSuccess<TaxRow>>(`${API}/${id}`));
            if (refreshed.success && refreshed.data) applyRow(refreshed.data);
          } else {
            const res = await firstValueFrom(http.post<ApiSuccess<{ taxId?: number; tax_id?: number }>>(API, body));
            const raw = res.data as Record<string, unknown> | undefined;
            const newId = Number(raw?.['taxId'] ?? raw?.['tax_id'] ?? 0);
            if (!res.success || !Number.isInteger(newId) || newId < 1) {
              const msg = 'Server did not return a new tax id.';
              updateState(store, '[Tax] Save error', { isSaving: false, saveError: msg });
              return { success: false, error: msg };
            }
            const loaded = await firstValueFrom(http.get<ApiSuccess<TaxRow>>(`${API}/${newId}`));
            if (loaded.success && loaded.data) applyRow(loaded.data);
            else {
              updateState(store, '[Tax] Create hydrate fallback', {
                editingTaxId: newId,
                taxName: name,
                taxPercentage,
                description: desc,
                isSaving: false,
                saveError: null,
              });
            }
          }
          updateState(store, '[Tax] Save done', { isSaving: false });
          return { success: true };
        } catch (e) {
          const msg = httpErrorMessage(e);
          updateState(store, '[Tax] Save error', { isSaving: false, saveError: msg });
          return { success: false, error: msg };
        }
      },

      async remove(taxId: number): Promise<{ success: boolean; error?: string }> {
        try {
          await firstValueFrom(http.delete<ApiSuccess<{ success: boolean }>>(`${API}/${taxId}`));
          resetNew();
          return { success: true };
        } catch (e) {
          return { success: false, error: httpErrorMessage(e) };
        }
      },
    };
  }),
);
