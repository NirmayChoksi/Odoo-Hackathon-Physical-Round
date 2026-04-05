import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { distinctUntilChanged, map } from 'rxjs';
import { TaxStore } from './tax.store';
import { SUBSCRIPTION_APP_PATHS } from '../subscription-app.constants';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-taxes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ConfirmDialogComponent],
  templateUrl: './taxes.html',
  styleUrl: './taxes.css',
})
export class TaxesComponent implements OnInit {
  readonly store = inject(TaxStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly paths = SUBSCRIPTION_APP_PATHS;

  readonly showDeactivateDialog = signal(false);
  readonly showClearDraftDialog = signal(false);
  readonly showNoticeDialog = signal(false);
  readonly noticeTitle = signal('Notice');
  readonly noticeMessage = signal('');
  readonly showSuccessDialog = signal(false);
  readonly successTitle = signal('Tax created');
  readonly successMessage = signal('');
  readonly isDeleting = signal(false);

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
          void this.store.loadTax(id);
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

  closeSuccessDialog() {
    this.showSuccessDialog.set(false);
  }

  onTaxAmountInput(value: string | number | null) {
    if (value === '' || value === null || value === undefined) {
      this.store.patchDraft({ taxPercentage: null });
      return;
    }
    const n = typeof value === 'number' ? value : Number(value);
    this.store.patchDraft({ taxPercentage: Number.isFinite(n) && n >= 0 ? n : null });
  }

  onNew() {
    this.store.clearSaveError();
    if (!this.store.taxName().trim()) {
      this.store.resetNew();
      void this.router.navigate([this.paths.taxNew], {
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
    const id = this.store.editingTaxId();
    if (!id) {
      this.showDeactivateDialog.set(false);
      return;
    }
    this.isDeleting.set(true);
    try {
      const r = await this.store.remove(id);
      this.showDeactivateDialog.set(false);
      if (r.success) {
        void this.router.navigate([this.paths.taxes]);
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
    void this.router.navigate([this.paths.taxNew], {
      queryParams: {},
      replaceUrl: true,
    });
  }

  async onSave() {
    this.store.clearSaveError();
    const beforeId = this.store.editingTaxId();
    const wasNew = !(beforeId != null && beforeId > 0);
    const r = await this.store.save();
    if (!r.success) {
      const title = this.store.isEditMode() ? 'Tax not saved' : 'Tax not created';
      this.openNotice(
        title,
        r.error ?? 'Please fill in all required fields and correct any errors, then try again.',
      );
      return;
    }

    const afterId = this.store.editingTaxId();
    if (afterId && afterId !== beforeId) {
      void this.router.navigate([this.paths.taxNew], {
        queryParams: { id: afterId },
        replaceUrl: true,
      });
    }

    if (wasNew) {
      const name = this.store.taxName().trim() || 'Tax';
      this.successTitle.set('Tax created');
      this.successMessage.set(`"${name}" was saved and is active.`);
      this.showSuccessDialog.set(true);
    }
  }
}
