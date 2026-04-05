import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SUBSCRIPTION_APP_PATHS } from '../subscription-app.constants';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog';

const API = '/api/internal/recurring-plans';

interface PlanRow {
  plan_id: number;
  plan_name: string;
  price: string | number;
  billing_period: string;
  minimum_quantity: number;
  status: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Component({
  selector: 'app-recurring-plan-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './recurring-plan-list.html',
  styleUrl: './recurring-plan-list.css',
})
export class RecurringPlanListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly paths = SUBSCRIPTION_APP_PATHS;

  plans = signal<PlanRow[]>([]);
  total = signal(0);
  page = signal(1);
  readonly pageSize = 20;
  isLoading = signal(false);
  loadError = signal<string | null>(null);
  readonly showDeleteConfirm = signal(false);
  readonly deleteTargetPlan = signal<PlanRow | null>(null);
  readonly isDeletingList = signal(false);
  readonly showNoticeDialog = signal(false);
  readonly noticeTitle = signal('Notice');
  readonly noticeMessage = signal('');
  searchQuery = signal('');
  selectedStatus = signal<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  totalPages = computed(() => Math.ceil(this.total() / this.pageSize) || 1);

  filteredPlans = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const st = this.selectedStatus();
    return this.plans().filter((p) => {
      const matchQ =
        !q ||
        p.plan_name.toLowerCase().includes(q) ||
        String(p.billing_period).toLowerCase().includes(q);
      const matchS = st === 'ALL' || p.status === st;
      return matchQ && matchS;
    });
  });

  ngOnInit() {
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
      const res = await firstValueFrom(
        this.http.get<ApiResponse<{ plans: PlanRow[]; pagination: { total: number } }>>(API, {
          params,
        }),
      );
      this.plans.set(res.data?.plans ?? []);
      this.total.set(res.data?.pagination?.total ?? 0);
      this.page.set(pg);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'error' in e
          ? String((e as { error?: { message?: string } }).error?.message ?? 'Failed to load plans')
          : 'Failed to load plans';
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
    void this.router.navigate([this.paths.recurringPlanNew]);
  }

  goToPlan(id: number) {
    void this.router.navigate([this.paths.recurringPlanNew], { queryParams: { id } });
  }

  deleteConfirmMessage(): string {
    const p = this.deleteTargetPlan();
    if (!p) return '';
    return `Deactivate "${p.plan_name}"? It will be marked inactive.`;
  }

  openDeleteConfirm(plan: PlanRow, event: Event) {
    event.stopPropagation();
    if (plan.status !== 'ACTIVE') return;
    this.deleteTargetPlan.set(plan);
    this.showDeleteConfirm.set(true);
  }

  closeDeleteConfirm() {
    this.showDeleteConfirm.set(false);
    this.deleteTargetPlan.set(null);
  }

  closeNoticeDialog() {
    this.showNoticeDialog.set(false);
  }

  async performListDelete() {
    const plan = this.deleteTargetPlan();
    if (!plan) {
      this.closeDeleteConfirm();
      return;
    }
    this.isDeletingList.set(true);
    try {
      await firstValueFrom(this.http.delete(`${API}/${plan.plan_id}`));
      this.closeDeleteConfirm();
      const pg = this.page();
      await this.loadPage(pg);
      if (this.plans().length === 0 && pg > 1) {
        await this.loadPage(pg - 1);
      }
    } catch (e: unknown) {
      this.closeDeleteConfirm();
      let msg = 'Could not deactivate plan.';
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

  formatPeriod(p: string): string {
    const u = p?.toUpperCase();
    if (u === 'WEEKLY') return 'Weekly';
    if (u === 'MONTHLY') return 'Monthly';
    if (u === 'YEARLY') return 'Yearly';
    if (u === 'DAILY') return 'Daily';
    return p || '—';
  }
}
