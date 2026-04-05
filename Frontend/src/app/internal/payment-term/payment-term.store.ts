import { computed, inject, isDevMode } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { updateState, withDevtools, withDevToolsStub } from '@angular-architects/ngrx-toolkit';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';

import type {
  DueType,
  PaymentMethodCode,
  PaymentTermDto,
  PaymentTermPageData,
  PaymentTermListResponse,
  StartFrom,
} from './payment-term.models';

export const PAYMENT_TERMS_API_BASE = '/api/internal/config/payment-terms';

export type ApiSuccess<T> = { success: true; message: string; data: T };

export interface EditableInstallment {
  installmentId?: number;
  installmentNumber: number;
  percentage: number;
  dueAfterDays: number;
  description: string;
}

type PaymentTermStoreState = {
  termsList: PaymentTermDto[];
  activeTermsForSelect: PaymentTermDto[];
  selectedId: number | null;
  forceNextSaveAsCreate: boolean;
  loading: boolean;
  saving: boolean;
  message: string | null;
  error: string | null;
  termName: string;
  description: string;
  dueType: DueType;
  days: number | null;
  graceDays: number;
  startFrom: StartFrom;
  isDefault: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  enableLateFee: boolean;
  lateFeeType: 'FIXED' | 'PERCENTAGE';
  lateFeeValue: number | null;
  lateFeeAfterDays: number | null;
  enableEarlyDiscount: boolean;
  earlyDiscountType: 'FIXED' | 'PERCENTAGE';
  earlyDiscountValue: number | null;
  earlyDiscountWithinDays: number | null;
  notes: string;
  internalRemarks: string;
  installments: EditableInstallment[];
  methodCard: boolean;
  methodBank: boolean;
  methodUpi: boolean;
  methodCash: boolean;
  defaultMethod: PaymentMethodCode | null;
};

const defaultInstallments = (): EditableInstallment[] => [
  { installmentNumber: 1, percentage: 50, dueAfterDays: 0, description: '' },
  { installmentNumber: 2, percentage: 50, dueAfterDays: 30, description: '' },
];

const initialForm = (): Omit<
  PaymentTermStoreState,
  | 'termsList'
  | 'activeTermsForSelect'
  | 'selectedId'
  | 'forceNextSaveAsCreate'
  | 'loading'
  | 'saving'
  | 'message'
  | 'error'
> => ({
  termName: '',
  description: '',
  dueType: 'FIXED_DAYS',
  days: 30,
  graceDays: 0,
  startFrom: 'INVOICE_DATE',
  isDefault: false,
  status: 'ACTIVE',
  enableLateFee: false,
  lateFeeType: 'PERCENTAGE',
  lateFeeValue: null,
  lateFeeAfterDays: null,
  enableEarlyDiscount: false,
  earlyDiscountType: 'PERCENTAGE',
  earlyDiscountValue: null,
  earlyDiscountWithinDays: null,
  notes: '',
  internalRemarks: '',
  installments: defaultInstallments(),
  methodCard: false,
  methodBank: true,
  methodUpi: true,
  methodCash: false,
  defaultMethod: 'BANK_TRANSFER',
});

const initialState: PaymentTermStoreState = {
  termsList: [],
  activeTermsForSelect: [],
  selectedId: null,
  forceNextSaveAsCreate: false,
  loading: false,
  saving: false,
  message: null,
  error: null,
  ...initialForm(),
};

function httpErr(e: unknown): string {
  if (e instanceof HttpErrorResponse) {
    const body = e.error as { message?: string; errors?: string[] } | undefined;
    return body?.errors?.join('; ') ?? body?.message ?? e.message;
  }
  return e instanceof Error ? e.message : 'Request failed';
}

const ptDevtools = isDevMode() ? withDevtools('paymentTerms') : withDevToolsStub('paymentTerms');

export const PaymentTermStore = signalStore(
  { providedIn: 'root' },
  ptDevtools,
  withState(initialState),
  withComputed(({ dueType }) => ({
    showSplitSection: computed(() => dueType() === 'SPLIT_PAYMENT'),
  })),
  withMethods((store, http = inject(HttpClient)) => {
    const refreshList = async (): Promise<void> => {
      updateState(store, '[PaymentTerms] List', { loading: true, error: null });
      try {
        const params = new HttpParams().set('page', '1').set('limit', '100');
        const res = await firstValueFrom(
          http.get<ApiSuccess<PaymentTermListResponse>>(PAYMENT_TERMS_API_BASE, { params }),
        );
        if (!res.success) throw new Error(res.message);
        updateState(store, '[PaymentTerms] List Success', {
          termsList: res.data.terms,
          loading: false,
        });
      } catch (e) {
        updateState(store, '[PaymentTerms] List Failure', {
          error: httpErr(e),
          loading: false,
        });
      }
    };

    function applyPageData(data: PaymentTermPageData): void {
      const t = data.paymentTerm;
      patchState(store, {
        termName: t.termName,
        description: t.description ?? '',
        dueType: t.dueType,
        days: t.days,
        graceDays: t.graceDays,
        startFrom: t.startFrom,
        isDefault: t.isDefault,
        status: t.status,
        enableLateFee: t.enableLateFee,
        lateFeeType: (t.lateFeeType as 'FIXED' | 'PERCENTAGE') ?? 'PERCENTAGE',
        lateFeeValue: t.lateFeeValue,
        lateFeeAfterDays: t.lateFeeAfterDays,
        enableEarlyDiscount: t.enableEarlyDiscount,
        earlyDiscountType: (t.earlyDiscountType as 'FIXED' | 'PERCENTAGE') ?? 'PERCENTAGE',
        earlyDiscountValue: t.earlyDiscountValue,
        earlyDiscountWithinDays: t.earlyDiscountWithinDays,
        notes: t.notes ?? '',
        internalRemarks: t.internalRemarks ?? '',
        installments: data.installments.map((i) => ({
          installmentId: i.installmentId,
          installmentNumber: i.installmentNumber,
          percentage: i.percentage,
          dueAfterDays: i.dueAfterDays,
          description: i.description ?? '',
        })),
      });
      const codes = new Set(data.methods.map((m) => m.paymentMethod));
      patchState(store, {
        methodCard: codes.has('CARD'),
        methodBank: codes.has('BANK_TRANSFER'),
        methodUpi: codes.has('UPI'),
        methodCash: codes.has('CASH'),
      });
      const def = data.methods.find((m) => m.isDefault);
      patchState(store, { defaultMethod: def?.paymentMethod ?? null });
    }

    function buildMethodsPayload(): { paymentMethod: PaymentMethodCode; isDefault: boolean }[] {
      const out: { paymentMethod: PaymentMethodCode; isDefault: boolean }[] = [];
      const d = store.defaultMethod();
      const add = (on: boolean, code: PaymentMethodCode) => {
        if (on) out.push({ paymentMethod: code, isDefault: d === code });
      };
      add(store.methodCard(), 'CARD');
      add(store.methodBank(), 'BANK_TRANSFER');
      add(store.methodUpi(), 'UPI');
      add(store.methodCash(), 'CASH');
      if (out.length && !out.some((m) => m.isDefault)) {
        out[0] = { ...out[0], isDefault: true };
      }
      return out;
    }

    function buildBody(): Record<string, unknown> {
      const inst = store.installments().map((r) => ({
        installmentNumber: r.installmentNumber,
        percentage: r.percentage,
        dueAfterDays: r.dueAfterDays,
        description: r.description || null,
      }));
      return {
        termName: store.termName().trim(),
        description: store.description().trim() || null,
        dueType: store.dueType(),
        days: store.days(),
        graceDays: store.graceDays(),
        startFrom: store.startFrom(),
        isDefault: store.isDefault(),
        status: store.status(),
        enableLateFee: store.enableLateFee(),
        lateFeeType: store.enableLateFee() ? store.lateFeeType() : null,
        lateFeeValue: store.enableLateFee() ? store.lateFeeValue() : null,
        lateFeeAfterDays: store.enableLateFee() ? store.lateFeeAfterDays() : null,
        enableEarlyDiscount: store.enableEarlyDiscount(),
        earlyDiscountType: store.enableEarlyDiscount() ? store.earlyDiscountType() : null,
        earlyDiscountValue: store.enableEarlyDiscount() ? store.earlyDiscountValue() : null,
        earlyDiscountWithinDays: store.enableEarlyDiscount() ? store.earlyDiscountWithinDays() : null,
        notes: store.notes().trim() || null,
        internalRemarks: store.internalRemarks().trim() || null,
        installments: store.showSplitSection() ? inst : [],
        methods: buildMethodsPayload(),
      };
    }

    return {
      patchDraft(patch: Partial<PaymentTermStoreState>): void {
        patchState(store, patch);
      },

      clearMessage(): void {
        patchState(store, { message: null });
      },

      resetFormToNew(): void {
        patchState(store, {
          selectedId: null,
          forceNextSaveAsCreate: true,
          message: null,
          error: null,
          ...initialForm(),
        });
      },

      refreshList,

      async loadForSubscriptionDropdown(): Promise<void> {
        try {
          const params = new HttpParams().set('page', '1').set('limit', '100').set('status', 'ACTIVE');
          const res = await firstValueFrom(
            http.get<ApiSuccess<PaymentTermListResponse>>(PAYMENT_TERMS_API_BASE, { params }),
          );
          if (!res.success) return;
          updateState(store, '[PaymentTerms] Select List', { activeTermsForSelect: res.data.terms });
        } catch {
          updateState(store, '[PaymentTerms] Select List Fail', { activeTermsForSelect: [] });
        }
      },

      async selectTerm(id: number): Promise<void> {
        updateState(store, '[PaymentTerms] Get', { loading: true, error: null });
        try {
          const res = await firstValueFrom(
            http.get<ApiSuccess<PaymentTermPageData>>(`${PAYMENT_TERMS_API_BASE}/${id}`),
          );
          if (!res.success) throw new Error(res.message);
          applyPageData(res.data);
          updateState(store, '[PaymentTerms] Get Success', {
            selectedId: id,
            message: null,
            loading: false,
            forceNextSaveAsCreate: false,
          });
        } catch (e) {
          updateState(store, '[PaymentTerms] Get Failure', {
            error: httpErr(e),
            loading: false,
          });
        }
      },

      async save(): Promise<void> {
        updateState(store, '[PaymentTerms] Save', { saving: true, error: null, message: null });
        try {
          const body = buildBody();
          const id = store.selectedId();
          const mustCreate = id == null || store.forceNextSaveAsCreate();
          if (mustCreate) {
            const res = await firstValueFrom(
              http.post<ApiSuccess<PaymentTermPageData>>(PAYMENT_TERMS_API_BASE, body),
            );
            if (!res.success) throw new Error(res.message);
            applyPageData(res.data);
            updateState(store, '[PaymentTerms] Create Success', {
              selectedId: res.data.paymentTerm.paymentTermId,
              message: 'Payment term created.',
              saving: false,
              forceNextSaveAsCreate: false,
            });
          } else {
            const res = await firstValueFrom(
              http.patch<ApiSuccess<PaymentTermPageData>>(`${PAYMENT_TERMS_API_BASE}/${id}`, body),
            );
            if (!res.success) throw new Error(res.message);
            applyPageData(res.data);
            updateState(store, '[PaymentTerms] Update Success', {
              message: 'Payment term updated.',
              saving: false,
              forceNextSaveAsCreate: false,
            });
          }
          await refreshList();
        } catch (e) {
          updateState(store, '[PaymentTerms] Save Failure', {
            error: httpErr(e),
            saving: false,
          });
        }
      },

      async remove(): Promise<void> {
        const id = store.selectedId();
        if (id == null) return;
        updateState(store, '[PaymentTerms] Delete', { saving: true, error: null });
        try {
          const res = await firstValueFrom(
            http.delete<ApiSuccess<{ paymentTermId: number; deleted: boolean }>>(
              `${PAYMENT_TERMS_API_BASE}/${id}`,
            ),
          );
          if (!res.success) throw new Error(res.message);
          patchState(store, {
            selectedId: null,
            forceNextSaveAsCreate: false,
            message: 'Deleted.',
            error: null,
            saving: false,
            ...initialForm(),
          });
          await refreshList();
        } catch (e) {
          updateState(store, '[PaymentTerms] Delete Failure', {
            error: httpErr(e),
            saving: false,
          });
        }
      },

      addInstallmentRow(): void {
        const rows = store.installments();
        const next = rows.length ? Math.max(...rows.map((r) => r.installmentNumber)) + 1 : 1;
        patchState(store, {
          installments: [...rows, { installmentNumber: next, percentage: 0, dueAfterDays: 0, description: '' }],
        });
      },

      removeInstallmentRow(index: number): void {
        const rows = [...store.installments()];
        rows.splice(index, 1);
        patchState(store, { installments: rows });
      },

      patchInst(index: number, key: keyof EditableInstallment, value: string | number): void {
        const rows = [...store.installments()];
        const cur = { ...rows[index] };
        if (key === 'installmentNumber' || key === 'percentage' || key === 'dueAfterDays') {
          const n = typeof value === 'string' ? Number(value) : value;
          (cur as Record<string, unknown>)[key] = Number.isFinite(n) ? n : 0;
        } else {
          (cur as Record<string, unknown>)[key] = value;
        }
        rows[index] = cur;
        patchState(store, { installments: rows });
      },

      setDefaultMethod(v: string): void {
        if (!v) {
          patchState(store, { defaultMethod: null });
          return;
        }
        patchState(store, { defaultMethod: v as PaymentMethodCode });
      },
    };
  }),
);
