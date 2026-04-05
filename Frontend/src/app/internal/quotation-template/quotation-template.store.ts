import { computed, inject, isDevMode } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { updateState, withDevtools, withDevToolsStub } from '@angular-architects/ngrx-toolkit';
import { signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';

const API = '/api/internal/quotation-templates';

type ApiSuccess<T> = { success: true; message: string; data: T };

export type QuotationTemplateItemDraft = {
  clientKey: string;
  template_item_id: number | null;
  product_id: number | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  tax_id: number | null;
};

type ItemBaseline = {
  product_id: number;
  quantity: number;
  unit_price: number;
  tax_id: number | null;
};

type QuotationTemplateState = {
  editingTemplateId: number | null;
  templateName: string;
  validityDays: number;
  planId: number | null;
  description: string;
  items: QuotationTemplateItemDraft[];
  itemBaselineByServerId: Record<number, ItemBaseline>;
  isLoading: boolean;
  isSaving: boolean;
  loadError: string | null;
  saveError: string | null;
};

function httpErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const e = err.error;
    if (e?.errors?.length) return e.errors.join('; ');
    return e?.message || e?.error || err.message || 'Request failed';
  }
  return 'Request failed';
}

function newClientKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? `k-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function emptyItemRow(): QuotationTemplateItemDraft {
  return {
    clientKey: newClientKey(),
    template_item_id: null,
    product_id: null,
    product_name: '',
    quantity: 1,
    unit_price: 0,
    tax_id: null,
  };
}

function mapTaxId(raw: Record<string, unknown>): number | null {
  const v = raw['tax_id'] ?? raw['taxId'];
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function mapApiItem(raw: Record<string, unknown>): QuotationTemplateItemDraft {
  const tid = raw['template_item_id'] ?? raw['templateItemId'];
  const pid = raw['product_id'] ?? raw['productId'];
  return {
    clientKey: newClientKey(),
    template_item_id: tid != null ? Number(tid) : null,
    product_id: pid != null && Number(pid) > 0 ? Number(pid) : null,
    product_name: String(raw['product_name'] ?? raw['productName'] ?? ''),
    quantity: Number(raw['quantity']) >= 1 ? Math.floor(Number(raw['quantity'])) : 1,
    unit_price: Number(raw['unit_price'] ?? raw['unitPrice']) || 0,
    tax_id: mapTaxId(raw),
  };
}

function buildBaseline(items: QuotationTemplateItemDraft[]): Record<number, ItemBaseline> {
  const out: Record<number, ItemBaseline> = {};
  for (const r of items) {
    if (r.template_item_id != null && r.product_id != null && r.product_id > 0) {
      out[r.template_item_id] = {
        product_id: r.product_id,
        quantity: r.quantity,
        unit_price: r.unit_price,
        tax_id: r.tax_id ?? null,
      };
    }
  }
  return out;
}

function itemPatchPayload(
  row: QuotationTemplateItemDraft,
  base: ItemBaseline | undefined,
): Record<string, unknown> | null {
  if (row.template_item_id == null || !base) return null;
  const body: Record<string, unknown> = {};
  if (row.product_id !== base.product_id) body['productId'] = row.product_id;
  if (row.quantity !== base.quantity) body['quantity'] = row.quantity;
  if (row.unit_price !== base.unit_price) body['unitPrice'] = row.unit_price;
  const rt = row.tax_id ?? null;
  const bt = base.tax_id ?? null;
  if (rt !== bt) body['taxId'] = rt;
  return Object.keys(body).length ? body : null;
}

const draftDefaults: Omit<
  QuotationTemplateState,
  'isLoading' | 'isSaving' | 'loadError' | 'saveError' | 'itemBaselineByServerId'
> = {
  editingTemplateId: null,
  templateName: '',
  validityDays: 30,
  planId: null,
  description: '',
  items: [],
};

const initialState: QuotationTemplateState = {
  ...draftDefaults,
  itemBaselineByServerId: {},
  isLoading: false,
  isSaving: false,
  loadError: null,
  saveError: null,
};

const quotationTemplateDevtools = isDevMode()
  ? withDevtools('quotationTemplate')
  : withDevToolsStub('quotationTemplate');

export const QuotationTemplateStore = signalStore(
  { providedIn: 'root' },
  quotationTemplateDevtools,
  withState(initialState),
  withComputed(({ editingTemplateId }) => ({
    isEditMode: computed(() => editingTemplateId() != null && editingTemplateId()! > 0),
  })),
  withMethods((store, http = inject(HttpClient)) => {
    const clientValidationError = (): string | null => {
      const name = store.templateName().trim();
      if (!name) {
        return 'Template name is required.';
      }

      const vd = store.validityDays();
      if (!Number.isFinite(Number(vd)) || Number(vd) < 1) {
        return 'Validity must be at least 1 day.';
      }

      for (const row of store.items()) {
        const hasProduct = row.product_id != null && row.product_id > 0;
        const hasExtra =
          row.unit_price !== 0 ||
          row.tax_id != null ||
          row.quantity !== 1 ||
          row.product_name.trim().length > 0;
        if (!hasProduct && hasExtra) {
          return 'Every line with a price, quantity other than 1, or tax needs a product selected.';
        }
        if (hasProduct) {
          if (!Number.isInteger(row.quantity) || row.quantity < 1) {
            return 'Each line needs a quantity of at least 1.';
          }
          if (!Number.isFinite(row.unit_price) || row.unit_price < 0) {
            return 'Unit price must be zero or greater.';
          }
        }
      }
      return null;
    };

    const rowsToPersist = () =>
      store.items().filter((r) => r.product_id != null && r.product_id > 0);

    const applyLoaded = (data: Record<string, unknown>) => {
      const tid = data['template_id'] ?? data['templateId'];
      const id = tid != null ? Number(tid) : null;
      const rawItems = (data['items'] as Record<string, unknown>[]) ?? [];
      const mapped = rawItems.map((x) => mapApiItem(x));
      const planRaw = data['plan_id'] ?? data['planId'];
      let planId: number | null = null;
      if (planRaw === null || planRaw === undefined || planRaw === '') {
        planId = null;
      } else {
        const n = Number(planRaw);
        planId = Number.isFinite(n) && n > 0 ? n : null;
      }
      updateState(store, '[QuotationTemplate] Hydrate', {
        editingTemplateId: id && id > 0 ? id : null,
        templateName: String(data['template_name'] ?? data['templateName'] ?? ''),
        validityDays: Number(data['validity_days'] ?? data['validityDays']) || 30,
        planId,
        description: String(data['description'] ?? ''),
        items: mapped.length ? mapped : [],
        itemBaselineByServerId: buildBaseline(mapped),
        loadError: null,
        saveError: null,
      });
    };

    const resetNew = () => {
      updateState(store, '[QuotationTemplate] Reset new', {
        ...draftDefaults,
        itemBaselineByServerId: {},
        isLoading: false,
        isSaving: false,
        loadError: null,
        saveError: null,
      });
    };

    return {
      patchDraft(
        patch: Partial<
          Pick<QuotationTemplateState, 'templateName' | 'validityDays' | 'planId' | 'description'>
        >,
      ) {
        updateState(store, '[QuotationTemplate] Patch draft', patch);
      },

      patchItem(index: number, patch: Partial<QuotationTemplateItemDraft>) {
        const arr = [...store.items()];
        if (index < 0 || index >= arr.length) return;
        arr[index] = { ...arr[index], ...patch };
        updateState(store, '[QuotationTemplate] Patch item', { items: arr });
      },

      addItemRow() {
        updateState(store, '[QuotationTemplate] Add row', {
          items: [...store.items(), emptyItemRow()],
        });
      },

      removeItemAt(index: number) {
        const arr = [...store.items()];
        if (index < 0 || index >= arr.length) return;
        arr.splice(index, 1);
        updateState(store, '[QuotationTemplate] Remove row', { items: arr });
      },

      resetNew,

      clearSaveError() {
        updateState(store, '[QuotationTemplate] Clear save error', { saveError: null });
      },

      async loadTemplate(templateId: number): Promise<{ success: boolean; error?: string }> {
        updateState(store, '[QuotationTemplate] Load start', { isLoading: true, loadError: null });
        try {
          const res = await firstValueFrom(
            http.get<ApiSuccess<Record<string, unknown>>>(`${API}/${templateId}`),
          );
          if (!res.success || !res.data) {
            updateState(store, '[QuotationTemplate] Load empty', {
              isLoading: false,
              loadError: 'Template not found',
            });
            return { success: false, error: 'Template not found' };
          }
          applyLoaded(res.data);
          updateState(store, '[QuotationTemplate] Load done', { isLoading: false });
          return { success: true };
        } catch (e) {
          const msg = httpErrorMessage(e);
          updateState(store, '[QuotationTemplate] Load error', { isLoading: false, loadError: msg });
          return { success: false, error: msg };
        }
      },

      async save(): Promise<{ success: boolean; error?: string }> {
        const validationMsg = clientValidationError();
        if (validationMsg) {
          return { success: false, error: validationMsg };
        }

        const name = store.templateName().trim();
        const validityDays = Math.max(1, Math.floor(Number(store.validityDays())));
        const planId = store.planId();
        const description = store.description().trim();
        const templateBody: Record<string, unknown> = {
          templateName: name,
          validityDays,
          planId: planId != null && planId > 0 ? planId : null,
        };
        if (description) {
          templateBody['description'] = description;
        }

        const toSync = rowsToPersist();

        updateState(store, '[QuotationTemplate] Save start', { isSaving: true, saveError: null });
        try {
          const editId = store.editingTemplateId();
          if (editId != null && editId > 0) {
            await firstValueFrom(http.patch<ApiSuccess<unknown>>(`${API}/${editId}`, templateBody));

            const baseline = { ...store.itemBaselineByServerId() };
            const currentIds = new Set(
              store.items().filter((r) => r.template_item_id != null).map((r) => r.template_item_id!),
            );

            for (const sidStr of Object.keys(baseline)) {
              const sid = Number(sidStr);
              if (!currentIds.has(sid)) {
                await firstValueFrom(http.delete<ApiSuccess<unknown>>(`${API}/${editId}/items/${sid}`));
              }
            }

            for (const row of store.items()) {
              if (row.template_item_id != null) {
                const patchBody = itemPatchPayload(row, baseline[row.template_item_id]);
                if (patchBody) {
                  await firstValueFrom(
                    http.patch<ApiSuccess<unknown>>(
                      `${API}/${editId}/items/${row.template_item_id}`,
                      patchBody,
                    ),
                  );
                }
              }
            }

            for (const row of toSync) {
              if (row.template_item_id == null) {
                await firstValueFrom(
                  http.post<ApiSuccess<unknown>>(`${API}/${editId}/items`, {
                    productId: row.product_id,
                    quantity: row.quantity,
                    unitPrice: row.unit_price,
                    taxId: row.tax_id ?? null,
                  }),
                );
              }
            }

            const refreshed = await firstValueFrom(
              http.get<ApiSuccess<Record<string, unknown>>>(`${API}/${editId}`),
            );
            if (refreshed.success && refreshed.data) {
              applyLoaded(refreshed.data);
            }
          } else {
            const res = await firstValueFrom(
              http.post<ApiSuccess<Record<string, unknown>>>(API, templateBody),
            );
            const data = res.data ?? {};
            const newId = Number(data['template_id'] ?? data['templateId']);
            if (!res.success || !Number.isInteger(newId) || newId < 1) {
              throw new Error('Create did not return a template id');
            }

            for (const row of toSync) {
              await firstValueFrom(
                http.post<ApiSuccess<unknown>>(`${API}/${newId}/items`, {
                  productId: row.product_id,
                  quantity: row.quantity,
                  unitPrice: row.unit_price,
                  taxId: row.tax_id ?? null,
                }),
              );
            }

            const loaded = await firstValueFrom(
              http.get<ApiSuccess<Record<string, unknown>>>(`${API}/${newId}`),
            );
            if (loaded.success && loaded.data) {
              applyLoaded(loaded.data);
            }
          }

          updateState(store, '[QuotationTemplate] Save done', { isSaving: false });
          return { success: true };
        } catch (e) {
          const msg = httpErrorMessage(e);
          updateState(store, '[QuotationTemplate] Save error', { isSaving: false, saveError: msg });
          return { success: false, error: msg };
        }
      },

      async remove(templateId: number): Promise<{ success: boolean; error?: string }> {
        try {
          await firstValueFrom(http.delete<ApiSuccess<unknown>>(`${API}/${templateId}`));
          resetNew();
          return { success: true };
        } catch (e) {
          return { success: false, error: httpErrorMessage(e) };
        }
      },
    };
  }),
);
