import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { distinctUntilChanged, firstValueFrom, map } from 'rxjs';
import { RecurringPlanStore, type BillingPeriodApi } from './recurring-plan.store';
import { SUBSCRIPTION_APP_PATHS } from '../subscription-app.constants';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog';

const PRODUCTS_API = '/api/internal/products';

export interface RpProductCatalogItem {
  product_id: number;
  product_name: string;
  sales_price: string;
}

export interface RpProductRow {
  productId: number | null;
  variant: string;
  price: string;
  minQty: string;
}

interface ProductsApiResponse {
  success: boolean;
  data: { products: RpProductCatalogItem[]; pagination: { total: number } };
}

@Component({
  selector: 'app-recurring-plan',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ConfirmDialogComponent],
  templateUrl: './recurring-plan.html',
  styleUrl: './recurring-plan.css',
})
export class RecurringPlanComponent implements OnInit {
  readonly store = inject(RecurringPlanStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly http = inject(HttpClient);

  readonly paths = SUBSCRIPTION_APP_PATHS;

  readonly showDeactivateDialog = signal(false);
  readonly showClearDraftDialog = signal(false);
  readonly showNoticeDialog = signal(false);
  readonly noticeTitle = signal('Notice');
  readonly noticeMessage = signal('');
  readonly isDeleting = signal(false);

  readonly productCatalog = signal<RpProductCatalogItem[]>([]);
  readonly productsLoading = signal(false);
  readonly productsLoadError = signal<string | null>(null);

  /** Wireframe: Weeks / Month / Year — maps to API billing_period. */
  readonly billingUnitOptions: { value: BillingPeriodApi; label: string }[] = [
    { value: 'WEEKLY', label: 'Weeks' },
    { value: 'MONTHLY', label: 'Month' },
    { value: 'YEARLY', label: 'Year' },
  ];

  readonly productRows = signal<RpProductRow[]>([
    { productId: null, variant: '', price: '', minQty: '' },
  ]);

  onBillingEveryInput(value: string | number | null) {
    if (value === '' || value === null || value === undefined) {
      this.store.patchDraft({ billingEvery: null });
      return;
    }
    const n = typeof value === 'number' ? value : Number(value);
    this.store.patchDraft({ billingEvery: Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1 });
  }

  onAutoCloseDaysInput(value: string | number | null) {
    if (value === '' || value === null || value === undefined) {
      this.store.patchDraft({ autoCloseDays: null });
      return;
    }
    const n = typeof value === 'number' ? value : Number(value);
    this.store.patchDraft({ autoCloseDays: Number.isFinite(n) && n >= 0 ? Math.floor(n) : null });
  }

  ngOnInit() {
    void this.loadProductCatalog();

    // Only react when `id` actually changes. Re-emissions with the same empty `id` would
    // call resetNew() again and wipe in-progress drafts while the user types.
    this.route.queryParamMap
      .pipe(
        map((q) => (q.get('id') ?? '').trim()),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((idStr) => {
        const id = idStr ? Number(idStr) : NaN;
        if (Number.isInteger(id) && id > 0) {
          void (async () => {
            await this.store.loadPlan(id);
            this.resetProductRows();
          })();
        } else {
          this.store.resetNew();
          this.resetProductRows();
        }
      });
  }

  resetProductRows() {
    this.productRows.set([{ productId: null, variant: '', price: '', minQty: '' }]);
  }

  /** Fetches all active catalog rows (API max 100 per page). */
  async loadProductCatalog() {
    this.productsLoading.set(true);
    this.productsLoadError.set(null);
    const acc: RpProductCatalogItem[] = [];
    try {
      let page = 1;
      let total = Infinity;
      const pageSize = 100;
      while (acc.length < total) {
        const params = new HttpParams()
          .set('page', String(page))
          .set('limit', String(pageSize))
          .set('status', 'ACTIVE');
        const res = await firstValueFrom(this.http.get<ProductsApiResponse>(PRODUCTS_API, { params }));
        const batch = res.data?.products ?? [];
        total = res.data?.pagination?.total ?? batch.length;
        for (const p of batch) {
          acc.push({
            product_id: p.product_id,
            product_name: p.product_name,
            sales_price: p.sales_price,
          });
        }
        if (batch.length === 0) break;
        page += 1;
        if (page > 100) break;
      }
      acc.sort((a, b) => a.product_name.localeCompare(b.product_name, undefined, { sensitivity: 'base' }));
      this.productCatalog.set(acc);
    } catch (e: unknown) {
      let msg = 'Failed to load products';
      if (e instanceof HttpErrorResponse) {
        const er = e.error;
        if (er?.errors?.length) msg = er.errors.join('; ');
        else if (er?.message) msg = String(er.message);
      }
      this.productsLoadError.set(msg);
      this.productCatalog.set([]);
    } finally {
      this.productsLoading.set(false);
    }
  }

  onProductRowChange(row: RpProductRow) {
    const id = row.productId;
    if (id == null) return;
    const p = this.productCatalog().find((x) => x.product_id === id);
    if (p?.sales_price != null && p.sales_price !== '') {
      const n = Number(p.sales_price);
      row.price = Number.isFinite(n) ? String(n) : p.sales_price;
    }
  }

  /**
   * Orange "New": with a plan name — save plan, link products to this plan (product_plans API),
   * then open New subscription with that plan pre-selected. Empty name — clear form only.
   */
  async onNew() {
    this.store.clearSaveError();

    if (!this.store.planName().trim()) {
      this.store.resetNew();
      this.resetProductRows();
      void this.router.navigate([this.paths.recurringPlanNew], {
        queryParams: {},
        replaceUrl: true,
      });
      return;
    }

    const r = await this.store.save();
    if (!r.success) return;

    const planId = this.store.editingPlanId();
    if (!planId || planId < 1) return;

    const attach = await this.attachProductsToPlan(planId);
    if (!attach.ok && attach.errors.length) {
      this.openNotice(
        'Product links',
        `Plan saved, but some product links failed:\n${attach.errors.join('\n')}`,
      );
    }

    void this.router.navigate([this.paths.subscriptionsNew], {
      queryParams: { plan: String(planId) },
    });
  }

  /** POST /api/internal/products/:productId/plans for each distinct product row. */
  private async attachProductsToPlan(planId: number): Promise<{ ok: boolean; errors: string[] }> {
    const errors: string[] = [];
    const productIds = [
      ...new Set(
        this.productRows().map((r) => r.productId).filter((id): id is number => id != null),
      ),
    ];

    for (let i = 0; i < productIds.length; i++) {
      const productId = productIds[i];
      try {
        await firstValueFrom(
          this.http.post<{ success: boolean; message?: string }>(
            `/api/internal/products/${productId}/plans`,
            { planId, isDefault: i === 0 },
          ),
        );
      } catch (e: unknown) {
        let msg = 'Request failed';
        if (e instanceof HttpErrorResponse) {
          const er = e.error;
          if (er?.errors?.length) msg = er.errors.join('; ');
          else if (er?.message) msg = String(er.message);
          else msg = e.message || msg;
        }
        errors.push(`Product #${productId}: ${msg}`);
      }
    }
    return { ok: errors.length === 0, errors };
  }

  onPrint() {
    document.body.classList.add('rp-print-mode');
    let cleaned = false;
    const done = () => {
      if (cleaned) return;
      cleaned = true;
      document.body.classList.remove('rp-print-mode');
      window.removeEventListener('afterprint', done);
    };
    window.addEventListener('afterprint', done);
    window.print();
    window.setTimeout(done, 800);
  }

  billingUnitLabel(): string {
    const p = this.store.billingPeriod();
    return this.billingUnitOptions.find((o) => o.value === p)?.label ?? p;
  }

  productDisplayName(productId: number | null): string {
    if (productId == null) return '—';
    return (
      this.productCatalog().find((x) => x.product_id === productId)?.product_name ?? `Product #${productId}`
    );
  }

  autoClosePrintLabel(): string {
    const d = this.store.autoCloseDays();
    if (d != null && d > 0) return `${d} days`;
    return '—';
  }

  async onSave() {
    const beforeId = this.store.editingPlanId();
    const r = await this.store.save();
    if (!r.success) return;

    const planId = this.store.editingPlanId();
    if (planId && planId > 0) {
      const attach = await this.attachProductsToPlan(planId);
      if (!attach.ok && attach.errors.length) {
        this.openNotice(
          'Product links',
          `Plan saved, but some product links failed:\n${attach.errors.join('\n')}`,
        );
      }
    }

    const afterId = this.store.editingPlanId();
    if (afterId && afterId !== beforeId) {
      void this.router.navigate([this.paths.recurringPlanNew], {
        queryParams: { id: afterId },
        replaceUrl: true,
      });
    }
  }

  openNotice(title: string, message: string) {
    this.noticeTitle.set(title);
    this.noticeMessage.set(message);
    this.showNoticeDialog.set(true);
  }

  closeNoticeDialog() {
    this.showNoticeDialog.set(false);
  }

  onDelete() {
    if (this.store.isSaving() || this.store.isLoading() || this.isDeleting()) return;
    if (this.store.isEditMode()) {
      this.showDeactivateDialog.set(true);
    } else {
      this.showClearDraftDialog.set(true);
    }
  }

  async performDeactivate() {
    const id = this.store.editingPlanId();
    if (!id) {
      this.showDeactivateDialog.set(false);
      return;
    }
    this.isDeleting.set(true);
    try {
      const r = await this.store.remove(id);
      this.showDeactivateDialog.set(false);
      if (r.success) {
        void this.router.navigate([this.paths.recurringPlans]);
      } else {
        this.openNotice('Could not deactivate', r.error ?? 'Request failed.');
      }
    } finally {
      this.isDeleting.set(false);
    }
  }

  performClearDraft() {
    this.showClearDraftDialog.set(false);
    this.store.clearSaveError();
    this.store.resetNew();
    this.resetProductRows();
    void this.router.navigate([this.paths.recurringPlanNew], {
      queryParams: {},
      replaceUrl: true,
    });
  }

  addProductRow() {
    this.productRows.update((rows) => [
      ...rows,
      { productId: null, variant: '', price: '', minQty: '' },
    ]);
  }
}
