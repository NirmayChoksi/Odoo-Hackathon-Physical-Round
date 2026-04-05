import { computed, inject, isDevMode } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { updateState, withDevtools, withDevToolsStub } from '@angular-architects/ngrx-toolkit';
import { signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';

const API = '/api/internal/recurring-plans';

export type BillingPeriodApi = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface RecurringPlanRow {
  plan_id: number;
  plan_name: string;
  price: string | number;
  billing_period: string;
  minimum_quantity: number;
  start_date: string | null;
  end_date: string | null;
  auto_close: number | boolean;
  closable: number | boolean;
  pausable: number | boolean;
  renewable: number | boolean;
  status: string;
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

function asBool(v: unknown): boolean {
  return v === true || v === 1 || v === '1';
}

function toDateInput(v: string | null | undefined): string {
  if (!v) return '';
  return String(v).split('T')[0] ?? '';
}

type RecurringPlanState = {
  editingPlanId: number | null;
  planName: string;
  price: number | null;
  billingPeriod: BillingPeriodApi;
  /** UI only — API stores period type only (WEEKLY / MONTHLY / YEARLY). */
  billingEvery: number | null;
  minimumQuantity: number | null;
  startDate: string;
  endDate: string;
  /** UI: days until auto-close; API only stores auto_close boolean. */
  autoCloseDays: number | null;
  closable: boolean;
  pausable: boolean;
  renewable: boolean;
  isLoading: boolean;
  isSaving: boolean;
  loadError: string | null;
  saveError: string | null;
};

const draftDefaults: Omit<
  RecurringPlanState,
  'isLoading' | 'isSaving' | 'loadError' | 'saveError'
> = {
  editingPlanId: null,
  planName: '',
  price: 0,
  billingPeriod: 'MONTHLY',
  billingEvery: 1,
  minimumQuantity: 1,
  startDate: '',
  endDate: '',
  autoCloseDays: null,
  closable: true,
  pausable: true,
  renewable: true,
};

const initialState: RecurringPlanState = {
  ...draftDefaults,
  isLoading: false,
  isSaving: false,
  loadError: null,
  saveError: null,
};

const recurringPlanDevtools = isDevMode()
  ? withDevtools('recurringPlan')
  : withDevToolsStub('recurringPlan');

export const RecurringPlanStore = signalStore(
  { providedIn: 'root' },
  recurringPlanDevtools,
  withState(initialState),
  withComputed(({ editingPlanId }) => ({
    isEditMode: computed(() => editingPlanId() != null && editingPlanId()! > 0),
  })),
  withMethods((store, http = inject(HttpClient)) => {
    const BILLING: readonly BillingPeriodApi[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];

    const applyRow = (row: RecurringPlanRow) => {
      const bp = row.billing_period?.toUpperCase() as BillingPeriodApi;
      let billingPeriod = BILLING.includes(bp) ? bp : 'MONTHLY';
      if (billingPeriod === 'DAILY') billingPeriod = 'MONTHLY';
      updateState(store, '[RecurringPlan] Hydrate', {
        editingPlanId: row.plan_id,
        planName: row.plan_name ?? '',
        price: Number(row.price) || 0,
        billingPeriod,
        billingEvery: 1,
        minimumQuantity: row.minimum_quantity ?? 1,
        startDate: toDateInput(row.start_date),
        endDate: toDateInput(row.end_date),
        autoCloseDays: asBool(row.auto_close) ? 1 : null,
        closable: asBool(row.closable),
        pausable: asBool(row.pausable),
        renewable: asBool(row.renewable),
        loadError: null,
        saveError: null,
      });
    };

    const resetNew = () => {
      updateState(store, '[RecurringPlan] Reset new', {
        ...draftDefaults,
        isLoading: false,
        isSaving: false,
        loadError: null,
        saveError: null,
      });
    };

    return {
    patchDraft(patch: Partial<Omit<RecurringPlanState, 'isLoading' | 'isSaving' | 'loadError' | 'saveError'>>) {
      updateState(store, '[RecurringPlan] Patch draft', patch);
    },

    resetNew,

    hydrateFromRow: applyRow,

    async loadPlan(planId: number): Promise<{ success: boolean; error?: string }> {
      updateState(store, '[RecurringPlan] Load start', { isLoading: true, loadError: null });
      try {
        const res = await firstValueFrom(http.get<ApiSuccess<RecurringPlanRow>>(`${API}/${planId}`));
        if (!res.success || !res.data) {
          updateState(store, '[RecurringPlan] Load empty', { isLoading: false, loadError: 'Plan not found' });
          return { success: false, error: 'Plan not found' };
        }
        applyRow(res.data);
        updateState(store, '[RecurringPlan] Load done', { isLoading: false });
        return { success: true };
      } catch (e) {
        const msg = httpErrorMessage(e);
        updateState(store, '[RecurringPlan] Load error', { isLoading: false, loadError: msg });
        return { success: false, error: msg };
      }
    },

    async save(): Promise<{ success: boolean; planId?: number; error?: string }> {
      const name = store.planName().trim();
      if (!name) {
        updateState(store, '[RecurringPlan] Validate', { saveError: 'Plan name is required.' });
        return { success: false, error: 'Plan name is required.' };
      }
      const price = store.price();
      if (price == null || !Number.isFinite(price) || price < 0) {
        updateState(store, '[RecurringPlan] Validate', { saveError: 'Price must be a number ≥ 0.' });
        return { success: false, error: 'Price must be a number ≥ 0.' };
      }
      const minQty = store.minimumQuantity() ?? 1;
      if (!Number.isFinite(minQty) || minQty < 1) {
        updateState(store, '[RecurringPlan] Validate', { saveError: 'Minimum quantity must be at least 1.' });
        return { success: false, error: 'Minimum quantity must be at least 1.' };
      }

      const body = {
        planName: name,
        price,
        billingPeriod: store.billingPeriod(),
        minimumQuantity: minQty,
        startDate: store.startDate().trim() || undefined,
        endDate: store.endDate().trim() || undefined,
        autoClose: (store.autoCloseDays() ?? 0) > 0,
        closable: store.closable(),
        pausable: store.pausable(),
        renewable: store.renewable(),
        status: 'ACTIVE',
      };

      updateState(store, '[RecurringPlan] Save start', { isSaving: true, saveError: null });
      try {
        const id = store.editingPlanId();
        if (id && id > 0) {
          await firstValueFrom(http.patch<ApiSuccess<RecurringPlanRow>>(`${API}/${id}`, body));
          const refreshed = await firstValueFrom(http.get<ApiSuccess<RecurringPlanRow>>(`${API}/${id}`));
          if (refreshed.success && refreshed.data) applyRow(refreshed.data);
        } else {
          const res = await firstValueFrom(http.post<ApiSuccess<RecurringPlanRow>>(API, body));
          if (res.success && res.data) {
            const row = res.data as RecurringPlanRow & { planId?: number };
            const pid = row.plan_id ?? row.planId;
            if (pid != null && Number(pid) > 0) {
              applyRow({ ...row, plan_id: Number(pid) });
            }
          }
        }
        updateState(store, '[RecurringPlan] Save done', { isSaving: false });
        return { success: true, planId: store.editingPlanId() ?? undefined };
      } catch (e) {
        const msg = httpErrorMessage(e);
        updateState(store, '[RecurringPlan] Save error', { isSaving: false, saveError: msg });
        return { success: false, error: msg };
      }
    },

    async remove(planId: number): Promise<{ success: boolean; error?: string }> {
      try {
        await firstValueFrom(http.delete<ApiSuccess<{ plan_id: number; deactivated: boolean }>>(`${API}/${planId}`));
        resetNew();
        return { success: true };
      } catch (e) {
        return { success: false, error: httpErrorMessage(e) };
      }
    },

    clearSaveError() {
      updateState(store, '[RecurringPlan] Clear save error', { saveError: null });
    },
    };
  }),
);
