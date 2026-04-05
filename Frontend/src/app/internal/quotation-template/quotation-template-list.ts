import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SUBSCRIPTION_APP_PATHS } from '../subscription-app.constants';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog';

const API = '/api/internal/quotation-templates';

interface TemplateListRow {
  template_id: number;
  template_name: string;
  validity_days: number;
  plan_id: number | null;
  description?: string | null;
  status: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Component({
  selector: 'app-quotation-template-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './quotation-template-list.html',
  styleUrl: './quotation-template-list.css',
})
export class QuotationTemplateListComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly paths = SUBSCRIPTION_APP_PATHS;

  templates = signal<TemplateListRow[]>([]);
  total = signal(0);
  page = signal(1);
  readonly pageSize = 20;
  isLoading = signal(false);
  loadError = signal<string | null>(null);
  searchQuery = signal('');
  selectedStatus = signal<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE');

  readonly showDeleteConfirm = signal(false);
  readonly deleteTarget = signal<TemplateListRow | null>(null);
  readonly isDeletingList = signal(false);
  readonly showNoticeDialog = signal(false);
  readonly noticeTitle = signal('Notice');
  readonly noticeMessage = signal('');

  totalPages = computed(() => Math.ceil(this.total() / this.pageSize) || 1);

  private searchDebounce?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    void this.loadPage(1);
  }

  ngOnDestroy() {
    clearTimeout(this.searchDebounce);
  }

  onSearchInput(value: string) {
    this.searchQuery.set(value);
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      void this.loadPage(1);
    }, 400);
  }

  clearSearch() {
    this.searchQuery.set('');
    clearTimeout(this.searchDebounce);
    void this.loadPage(1);
  }

  async loadPage(pg: number) {
    this.isLoading.set(true);
    this.loadError.set(null);
    try {
      let params = new HttpParams().set('page', String(pg)).set('limit', String(this.pageSize));
      if (this.selectedStatus() !== 'ALL') {
        params = params.set('status', this.selectedStatus());
      }
      const q = this.searchQuery().trim();
      if (q) {
        params = params.set('search', q);
      }
      const res = await firstValueFrom(
        this.http.get<
          ApiResponse<{ templates: TemplateListRow[]; pagination: { total: number } }>
        >(API, { params }),
      );
      this.templates.set(res.data?.templates ?? []);
      this.total.set(res.data?.pagination?.total ?? 0);
      this.page.set(pg);
    } catch (e: unknown) {
      let msg = 'Failed to load quotation templates.';
      if (e instanceof HttpErrorResponse) {
        const er = e.error;
        if (er?.errors?.length) msg = er.errors.join('; ');
        else if (er?.message) msg = String(er.message);
      }
      this.loadError.set(msg);
    } finally {
      this.isLoading.set(false);
    }
  }

  async onStatusChange(st: string) {
    const v = st as 'ALL' | 'ACTIVE' | 'INACTIVE';
    this.selectedStatus.set(v);
    await this.loadPage(1);
  }

  prevPage() {
    if (this.page() > 1) void this.loadPage(this.page() - 1);
  }

  nextPage() {
    if (this.page() < this.totalPages()) void this.loadPage(this.page() + 1);
  }

  goToNew() {
    void this.router.navigate([this.paths.quotationTemplateNew]);
  }

  goToTemplate(id: number) {
    void this.router.navigate([this.paths.quotationTemplateNew], { queryParams: { id } });
  }

  deleteConfirmMessage(): string {
    const t = this.deleteTarget();
    if (!t) return '';
    return `Deactivate "${t.template_name}"? It will be marked inactive.`;
  }

  isRowActive(row: TemplateListRow): boolean {
    return String(row.status ?? '').toUpperCase() === 'ACTIVE';
  }

  openDeleteConfirm(row: TemplateListRow, event: Event) {
    event.stopPropagation();
    if (!this.isRowActive(row)) return;
    this.deleteTarget.set(row);
    this.showDeleteConfirm.set(true);
  }

  closeDeleteConfirm() {
    this.showDeleteConfirm.set(false);
    this.deleteTarget.set(null);
  }

  closeNoticeDialog() {
    this.showNoticeDialog.set(false);
  }

  async performListDelete() {
    const row = this.deleteTarget();
    if (!row || !this.isRowActive(row)) {
      this.closeDeleteConfirm();
      return;
    }
    this.isDeletingList.set(true);
    try {
      await firstValueFrom(this.http.delete(`${API}/${row.template_id}`));
      this.closeDeleteConfirm();
      const pg = this.page();
      await this.loadPage(pg);
      if (this.templates().length === 0 && pg > 1) {
        await this.loadPage(pg - 1);
      }
    } catch (e: unknown) {
      this.closeDeleteConfirm();
      let msg = 'Could not deactivate template.';
      if (e instanceof HttpErrorResponse) {
        const er = e.error;
        if (er?.errors?.length) msg = er.errors.join('; ');
        else if (er?.message) msg = String(er.message);
      }
      this.noticeTitle.set('Could not deactivate');
      this.noticeMessage.set(msg);
      this.showNoticeDialog.set(true);
    } finally {
      this.isDeletingList.set(false);
    }
  }
}
