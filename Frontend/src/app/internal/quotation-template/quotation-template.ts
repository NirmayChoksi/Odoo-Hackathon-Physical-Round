import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { distinctUntilChanged, firstValueFrom, map } from 'rxjs';
import { QuotationTemplateStore } from './quotation-template.store';
import { SUBSCRIPTION_APP_PATHS } from '../subscription-app.constants';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog';

interface PlanOption {
  plan_id: number;
  plan_name: string;
}

interface ProductOption {
  product_id: number;
  product_name: string;
}

interface TaxOption {
  tax_id: number;
  tax_name: string;
}

@Component({
  selector: 'app-quotation-template',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ConfirmDialogComponent],
  templateUrl: './quotation-template.html',
  styleUrl: './quotation-template.css',
})
export class QuotationTemplateComponent implements OnInit {
  readonly store = inject(QuotationTemplateStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly http = inject(HttpClient);

  readonly paths = SUBSCRIPTION_APP_PATHS;

  planOptions = signal<PlanOption[]>([]);
  productOptions = signal<ProductOption[]>([]);
  taxOptions = signal<TaxOption[]>([]);
  lookupsError = signal<string | null>(null);

  readonly showDeactivateDialog = signal(false);
  readonly showClearDraftDialog = signal(false);
  readonly showNoticeDialog = signal(false);
  readonly noticeTitle = signal('Notice');
  readonly noticeMessage = signal('');
  readonly isDeleting = signal(false);

  ngOnInit() {
    void this.loadLookups();

    this.route.queryParamMap
      .pipe(
        map((q) => (q.get('id') ?? '').trim()),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((idStr) => {
        const id = idStr ? Number(idStr) : NaN;
        if (Number.isInteger(id) && id > 0) {
          void this.store.loadTemplate(id);
        } else {
          this.store.resetNew();
        }
      });
  }

  private async loadLookups() {
    this.lookupsError.set(null);
    try {
      const params = new HttpParams().set('page', '1').set('limit', '500');
      const taxParams = new HttpParams().set('page', '1').set('limit', '200').set('status', 'ACTIVE');
      const [plansRes, prodRes, taxRes] = await Promise.all([
        firstValueFrom(
          this.http.get<{
            success: boolean;
            data: { plans: PlanOption[] };
          }>('/api/internal/recurring-plans', { params }),
        ),
        firstValueFrom(
          this.http.get<{
            success: boolean;
            data: { products: ProductOption[] };
          }>('/api/internal/products', { params }),
        ),
        firstValueFrom(
          this.http.get<{
            success: boolean;
            data: { taxes: TaxOption[] };
          }>('/api/internal/taxes', { params: taxParams }),
        ),
      ]);
      this.planOptions.set(plansRes.data?.plans ?? []);
      this.productOptions.set(prodRes.data?.products ?? []);
      this.taxOptions.set(taxRes.data?.taxes ?? []);
    } catch {
      this.lookupsError.set('Could not load plans, products, or taxes. Some dropdowns may be empty.');
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

  onPlanSelect(value: string) {
    if (!value) {
      this.store.patchDraft({ planId: null });
      return;
    }
    const n = Number(value);
    this.store.patchDraft({ planId: Number.isFinite(n) && n > 0 ? n : null });
  }

  onProductSelect(index: number, value: string) {
    const pid = value ? Number(value) : NaN;
    const p = this.productOptions().find((x) => x.product_id === pid);
    this.store.patchItem(index, {
      product_id: Number.isFinite(pid) && pid > 0 ? pid : null,
      product_name: p?.product_name ?? '',
    });
  }

  onTaxSelect(index: number, value: string) {
    if (!value) {
      this.store.patchItem(index, { tax_id: null });
      return;
    }
    const n = Number(value);
    this.store.patchItem(index, { tax_id: Number.isFinite(n) && n > 0 ? n : null });
  }

  onNew() {
    this.store.clearSaveError();
    if (!this.store.templateName().trim()) {
      this.store.resetNew();
      void this.router.navigate([this.paths.quotationTemplateNew], {
        queryParams: {},
        replaceUrl: true,
      });
      return;
    }
    void this.onSave();
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
    const id = this.store.editingTemplateId();
    if (!id) {
      this.showDeactivateDialog.set(false);
      return;
    }
    this.isDeleting.set(true);
    try {
      const r = await this.store.remove(id);
      this.showDeactivateDialog.set(false);
      if (r.success) {
        void this.router.navigate([this.paths.quotationTemplates]);
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
    void this.router.navigate([this.paths.quotationTemplateNew], {
      queryParams: {},
      replaceUrl: true,
    });
  }

  async onSave() {
    this.store.clearSaveError();
    const beforeId = this.store.editingTemplateId();
    const r = await this.store.save();
    if (!r.success) {
      const title = this.store.isEditMode() ? 'Template not saved' : 'Template not created';
      this.openNotice(
        title,
        r.error ?? 'Please fill in all required fields and correct any errors, then try again.',
      );
      return;
    }

    const afterId = this.store.editingTemplateId();
    if (afterId && afterId !== beforeId) {
      void this.router.navigate([this.paths.quotationTemplateNew], {
        queryParams: { id: afterId },
        replaceUrl: true,
      });
      this.openNotice(
        'Template created',
        'Your quotation template was created successfully. You can keep editing or return to the list.',
      );
    }
  }
}
