import { computed, inject, isDevMode } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { updateState, withDevtools, withDevToolsStub } from '@angular-architects/ngrx-toolkit';
import { signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';

const API = '/api/internal/discounts';

export type DiscountTypeUi = 'Percentage' | 'Fixed Price';

export interface DiscountRow {
  discount_id: number;
  discount_name: string;
  coupon_code: string | null;
  discount_type: string;
  discount_value: number;
  minimum_purchase: number;
  minimum_quantity: number;
  start_date: string | null;
  end_date: string | null;
  limit_usage: number | null;
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

function toDateInput(v: string | null | undefined): string {
  if (!v) return '';
  return String(v).split('T')[0] ?? '';
}

function toApiType(ui: DiscountTypeUi): 'PERCENTAGE' | 'FIXED' {
  return ui === 'Percentage' ? 'PERCENTAGE' : 'FIXED';
}

function fromApiType(t: string | undefined): DiscountTypeUi {
  return String(t ?? '').toUpperCase() === 'PERCENTAGE' ? 'Percentage' : 'Fixed Price';
}

/** Allowed date input: exactly `YYYY-MM-DD` (10 chars), real calendar date, year 1900–2100. */
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function validateIsoDateOrEmpty(fieldLabel: string, raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  if (s.length !== 10 || !ISO_DATE_RE.test(s)) {
    return `${fieldLabel} must be exactly YYYY-MM-DD (10 characters), e.g. 2026-04-05.`;
  }
  const m = s.match(ISO_DATE_RE)!;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (y < 1900 || y > 2100) {
    return `${fieldLabel} year must be between 1900 and 2100.`;
  }
  if (mo < 1 || mo > 12) {
    return `${fieldLabel} has an invalid month.`;
  }
  const lastDay = new Date(y, mo, 0).getDate();
  if (d < 1 || d > lastDay) {
    return `${fieldLabel} is not a valid day for that month and year.`;
  }
  return null;
}

type DiscountState = {
  editingDiscountId: number | null;
  discountName: string;
  discountType: DiscountTypeUi;
  discountValue: number | null;
  minimumPurchase: number | null;
  minimumQuantity: number | null;
  couponCode: string;
  startDate: string;
  endDate: string;
  limitUsage: boolean;
  limitUsageCount: number | null;
  isLoading: boolean;
  isSaving: boolean;
  loadError: string | null;
  saveError: string | null;
};

const draftDefaults: Omit<DiscountState, 'isLoading' | 'isSaving' | 'loadError' | 'saveError'> = {
  editingDiscountId: null,
  discountName: '',
  discountType: 'Percentage',
  discountValue: null,
  minimumPurchase: null,
  minimumQuantity: null,
  couponCode: '',
  startDate: '',
  endDate: '',
  limitUsage: false,
  limitUsageCount: null,
};

const initialState: DiscountState = {
  ...draftDefaults,
  isLoading: false,
  isSaving: false,
  loadError: null,
  saveError: null,
};

const discountDevtools = isDevMode()
  ? withDevtools('discount')
  : withDevToolsStub('discount');

export const DiscountStore = signalStore(
  { providedIn: 'root' },
  discountDevtools,
  withState(initialState),
  withComputed(({ editingDiscountId }) => ({
    isEditMode: computed(() => editingDiscountId() != null && editingDiscountId()! > 0),
  })),
  withMethods((store, http = inject(HttpClient)) => {
    /** Client-side rules before calling the API. Returns a message to show in a dialog, or null if OK. */
    const clientValidationError = (): string | null => {
      const name = store.discountName().trim();
      if (!name) {
        return 'Discount name is required. Enter a name before saving.';
      }

      const dv = store.discountValue();
      const numVal = dv != null && Number.isFinite(Number(dv)) ? Number(dv) : NaN;
      if (!Number.isFinite(numVal) || numVal < 0) {
        return 'Please enter a valid discount value (0 or greater).';
      }
      const eid = store.editingDiscountId();
      const isNewDiscount = eid == null || eid < 1;
      if (isNewDiscount && numVal <= 0) {
        return 'Discount value is required and must be greater than zero.';
      }

      if (store.limitUsage()) {
        const c = store.limitUsageCount();
        if (c == null || !Number.isFinite(Number(c)) || Number(c) < 1) {
          return 'Limit usage is turned on: enter a maximum number of uses (at least 1).';
        }
      }

      const sd = store.startDate().trim();
      const ed = store.endDate().trim();
      const startErr = validateIsoDateOrEmpty('Start date', sd);
      if (startErr) return startErr;
      const endErr = validateIsoDateOrEmpty('End date', ed);
      if (endErr) return endErr;
      if (sd && ed && ed < sd) {
        return 'End date must be on or after the start date.';
      }

      const mq = store.minimumQuantity();
      if (mq != null && (!Number.isFinite(Number(mq)) || Number(mq) < 1)) {
        return 'Minimum quantity must be at least 1, or leave the field empty.';
      }

      const mp = store.minimumPurchase();
      if (mp != null && (!Number.isFinite(Number(mp)) || Number(mp) < 0)) {
        return 'Minimum purchase cannot be negative.';
      }

      return null;
    };

    const applyRow = (row: DiscountRow) => {
      const lim = row.limit_usage;
      updateState(store, '[Discount] Hydrate', {
        editingDiscountId: row.discount_id,
        discountName: row.discount_name ?? '',
        discountType: fromApiType(row.discount_type),
        discountValue: Number(row.discount_value) || 0,
        minimumPurchase: Number(row.minimum_purchase) || 0,
        minimumQuantity: Number(row.minimum_quantity) || 0,
        couponCode: row.coupon_code ?? '',
        startDate: toDateInput(row.start_date),
        endDate: toDateInput(row.end_date),
        limitUsage: lim != null && lim > 0,
        limitUsageCount: lim != null && lim > 0 ? lim : null,
        loadError: null,
        saveError: null,
      });
    };

    const resetNew = () => {
      updateState(store, '[Discount] Reset new', {
        ...draftDefaults,
        isLoading: false,
        isSaving: false,
        loadError: null,
        saveError: null,
      });
    };

    return {
      patchDraft(patch: Partial<Omit<DiscountState, 'isLoading' | 'isSaving' | 'loadError' | 'saveError'>>) {
        updateState(store, '[Discount] Patch draft', patch);
      },

      resetNew,

      clearSaveError() {
        updateState(store, '[Discount] Clear save error', { saveError: null });
      },

      async loadDiscount(discountId: number): Promise<{ success: boolean; error?: string }> {
        updateState(store, '[Discount] Load start', { isLoading: true, loadError: null });
        try {
          const res = await firstValueFrom(http.get<ApiSuccess<DiscountRow>>(`${API}/${discountId}`));
          if (!res.success || !res.data) {
            updateState(store, '[Discount] Load empty', { isLoading: false, loadError: 'Discount not found' });
            return { success: false, error: 'Discount not found' };
          }
          applyRow(res.data);
          updateState(store, '[Discount] Load done', { isLoading: false });
          return { success: true };
        } catch (e) {
          const msg = httpErrorMessage(e);
          updateState(store, '[Discount] Load error', { isLoading: false, loadError: msg });
          return { success: false, error: msg };
        }
      },

      async save(): Promise<{ success: boolean; error?: string }> {
        const validationMsg = clientValidationError();
        if (validationMsg) {
          updateState(store, '[Discount] Validate client', { saveError: null });
          return { success: false, error: validationMsg };
        }

        const name = store.discountName().trim();
        const dv = store.discountValue();
        const discountValue = dv != null && Number.isFinite(Number(dv)) ? Number(dv) : 0;

        const couponTrimmed = store.couponCode().trim();
        const body: Record<string, unknown> = {
          discountName: name,
          discountType: toApiType(store.discountType()),
          discountValue,
          minPurchaseAmount: store.minimumPurchase() ?? 0,
          minQuantity: store.minimumQuantity() ?? 0,
          /** Omit when empty so backend stores NULL (UNIQUE coupon_code rejects duplicate ""). */
          ...(couponTrimmed ? { couponCode: couponTrimmed } : {}),
          startDate: store.startDate().trim() || undefined,
          endDate: store.endDate().trim() || undefined,
          limitUsage: store.limitUsage() ? (store.limitUsageCount() ?? null) : null,
          status: 'ACTIVE',
        };

        updateState(store, '[Discount] Save start', { isSaving: true, saveError: null });
        try {
          const id = store.editingDiscountId();
          if (id && id > 0) {
            await firstValueFrom(http.patch<ApiSuccess<{ success: boolean }>>(`${API}/${id}`, body));
            const refreshed = await firstValueFrom(http.get<ApiSuccess<DiscountRow>>(`${API}/${id}`));
            if (refreshed.success && refreshed.data) applyRow(refreshed.data);
          } else {
            const res = await firstValueFrom(
              http.post<ApiSuccess<{ discountId: number }>>(API, body),
            );
            const newId = res.data?.discountId;
            if (res.success && newId != null && newId > 0) {
              const loaded = await firstValueFrom(http.get<ApiSuccess<DiscountRow>>(`${API}/${newId}`));
              if (loaded.success && loaded.data) applyRow(loaded.data);
            }
          }
          updateState(store, '[Discount] Save done', { isSaving: false });
          return { success: true };
        } catch (e) {
          const msg = httpErrorMessage(e);
          updateState(store, '[Discount] Save error', { isSaving: false, saveError: msg });
          return { success: false, error: msg };
        }
      },

      async remove(discountId: number): Promise<{ success: boolean; error?: string }> {
        try {
          await firstValueFrom(http.delete<ApiSuccess<{ success: boolean }>>(`${API}/${discountId}`));
          resetNew();
          return { success: true };
        } catch (e) {
          return { success: false, error: httpErrorMessage(e) };
        }
      },
    };
  }),
);
