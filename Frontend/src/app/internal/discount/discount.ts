import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { distinctUntilChanged, map } from 'rxjs';
import { DiscountStore, type DiscountTypeUi } from './discount.store';
import { SUBSCRIPTION_APP_PATHS } from '../subscription-app.constants';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-discount',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ConfirmDialogComponent],
  templateUrl: './discount.html',
  styleUrl: './discount.css',
})
export class DiscountComponent implements OnInit {
  readonly store = inject(DiscountStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly paths = SUBSCRIPTION_APP_PATHS;

  readonly showDeactivateDialog = signal(false);
  readonly showClearDraftDialog = signal(false);
  readonly showNoticeDialog = signal(false);
  readonly noticeTitle = signal('Notice');
  readonly noticeMessage = signal('');
  readonly isDeleting = signal(false);

  readonly discountTypes: DiscountTypeUi[] = ['Fixed Price', 'Percentage'];

  ngOnInit() {
    this.route.queryParamMap
      .pipe(
        map((q) => (q.get('id') ?? '').trim()),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((idStr) => {
        const id = idStr ? Number(idStr) : NaN;
        if (Number.isInteger(id) && id > 0) {
          void this.store.loadDiscount(id);
        } else {
          this.store.resetNew();
        }
      });
  }

  openNotice(title: string, message: string) {
    this.noticeTitle.set(title);
    this.noticeMessage.set(message);
    this.showNoticeDialog.set(true);
  }

  closeNoticeDialog() {
    this.showNoticeDialog.set(false);
  }

  onDiscountValueInput(value: string | number | null) {
    if (value === '' || value === null || value === undefined) {
      this.store.patchDraft({ discountValue: null });
      return;
    }
    const n = typeof value === 'number' ? value : Number(value);
    this.store.patchDraft({ discountValue: Number.isFinite(n) && n >= 0 ? n : null });
  }

  onMinPurchaseInput(value: string | number | null) {
    if (value === '' || value === null || value === undefined) {
      this.store.patchDraft({ minimumPurchase: null });
      return;
    }
    const n = typeof value === 'number' ? value : Number(value);
    this.store.patchDraft({ minimumPurchase: Number.isFinite(n) && n >= 0 ? n : null });
  }

  onMinQuantityInput(value: string | number | null) {
    if (value === '' || value === null || value === undefined) {
      this.store.patchDraft({ minimumQuantity: null });
      return;
    }
    const n = typeof value === 'number' ? value : Number(value);
    this.store.patchDraft({
      minimumQuantity: Number.isFinite(n) && n >= 1 ? Math.floor(n) : null,
    });
  }

  onLimitCountInput(value: string | number | null) {
    if (value === '' || value === null || value === undefined) {
      this.store.patchDraft({ limitUsageCount: null });
      return;
    }
    const n = typeof value === 'number' ? value : Number(value);
    this.store.patchDraft({
      limitUsageCount: Number.isFinite(n) && n >= 1 ? Math.floor(n) : null,
    });
  }

  /** Keep at most 10 chars (YYYY-MM-DD); `type="date"` normally enforces format. */
  onDateInput(field: 'startDate' | 'endDate', value: string) {
    let v = String(value ?? '').trim();
    if (v.length > 10) {
      v = v.slice(0, 10);
    }
    this.store.patchDraft(field === 'startDate' ? { startDate: v } : { endDate: v });
  }

  onNew() {
    this.store.clearSaveError();
    if (!this.store.discountName().trim()) {
      this.store.resetNew();
      void this.router.navigate([this.paths.discountNew], {
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
    const id = this.store.editingDiscountId();
    if (!id) {
      this.showDeactivateDialog.set(false);
      return;
    }
    this.isDeleting.set(true);
    try {
      const r = await this.store.remove(id);
      this.showDeactivateDialog.set(false);
      if (r.success) {
        void this.router.navigate([this.paths.discounts]);
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
    void this.router.navigate([this.paths.discountNew], {
      queryParams: {},
      replaceUrl: true,
    });
  }

  async onSave() {
    this.store.clearSaveError();
    const beforeId = this.store.editingDiscountId();
    const r = await this.store.save();
    if (!r.success) {
      const title = this.store.isEditMode() ? 'Discount not saved' : 'Discount not created';
      this.openNotice(
        title,
        r.error ?? 'Please fill in all required fields and correct any errors, then try again.',
      );
      return;
    }

    const afterId = this.store.editingDiscountId();
    if (afterId && afterId !== beforeId) {
      void this.router.navigate([this.paths.discountNew], {
        queryParams: { id: afterId },
        replaceUrl: true,
      });
    }
  }
}
