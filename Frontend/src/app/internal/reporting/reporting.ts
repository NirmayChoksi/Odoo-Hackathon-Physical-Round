import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ReportingApiService, type ReportFilterParams } from './reporting-api.service';
import type { ReportingPageData, ReportMeta, StatusCountItem, RevenueTrendItem } from './reporting.models';
import {
  CONFIGURATION_DROPDOWN_ITEMS,
  SUBSCRIPTION_APP_PATHS,
  USERS_CONTACTS_DROPDOWN_ITEMS,
} from '../subscription-app.constants';

const CHART_COLORS = ['#f1916d', '#8b7cf6', '#38bdf8', '#34d399', '#fbbf24', '#f472b6', '#94a3b8'];

function localYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function defaultRange(): { from: string; to: string } {
  const now = new Date();
  const to = localYmd(now);
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: localYmd(first), to };
}

@Component({
  selector: 'app-reporting',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './reporting.html',
  styleUrl: './reporting.css',
})
export class ReportingComponent {
  private readonly api = inject(ReportingApiService);

  readonly paths = SUBSCRIPTION_APP_PATHS;

  navItems = signal([
    { label: 'Subscriptions', active: false, path: SUBSCRIPTION_APP_PATHS.subscriptions },
    { label: 'Products', active: false, path: SUBSCRIPTION_APP_PATHS.products },
    { label: 'Reporting', active: true, path: SUBSCRIPTION_APP_PATHS.reporting },
    {
      label: 'Users/Contacts',
      active: false,
      path: SUBSCRIPTION_APP_PATHS.users,
      isDropdown: true,
      dropdownItems: [...USERS_CONTACTS_DROPDOWN_ITEMS],
    },
    {
      label: 'Configuration',
      active: false,
      isDropdown: true,
      dropdownItems: [...CONFIGURATION_DROPDOWN_ITEMS],
    },
  ]);

  navDropdownOpenKey = signal<string | null>(null);

  meta = signal<ReportMeta | null>(null);
  pageData = signal<ReportingPageData | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  tableTab = signal<'subs' | 'revenue' | 'payments' | 'overdue'>('subs');

  fromDate = signal(defaultRange().from);
  toDate = signal(defaultRange().to);
  customerId = signal('');
  productId = signal('');
  planId = signal('');
  subscriptionStatus = signal('');
  invoiceStatus = signal('');
  paymentStatus = signal('');
  billingPeriod = signal('');

  subscriptionStatuses = ['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'CLOSED'] as const;
  invoiceStatuses = ['DRAFT', 'CONFIRMED', 'PAID', 'CANCELLED'] as const;
  paymentStatuses = ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'] as const;
  billingPeriods = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const;

  maxRevenue = computed(() => {
    const t = this.pageData()?.revenueTrend ?? [];
    return Math.max(1, ...t.map((x) => x.revenue));
  });

  maxOverdueAmt = computed(() => {
    const t = this.pageData()?.overdueTrend ?? [];
    return Math.max(1, ...t.map((x) => x.overdueAmount));
  });

  constructor() {
    window.addEventListener('click', () => this.navDropdownOpenKey.set(null));
    void this.bootstrap();
  }

  private async bootstrap() {
    try {
      const m = await firstValueFrom(this.api.meta());
      if (m.success) this.meta.set(m.data);
    } catch {
      /* meta optional */
    }
    await this.applyFilters();
  }

  private filterPayload(): ReportFilterParams {
    const c = this.customerId().trim();
    const pr = this.productId().trim();
    const pl = this.planId().trim();
    return {
      fromDate: this.fromDate(),
      toDate: this.toDate(),
      ...(c ? { customerId: Number(c) } : {}),
      ...(pr ? { productId: Number(pr) } : {}),
      ...(pl ? { planId: Number(pl) } : {}),
      ...(this.subscriptionStatus() ? { subscriptionStatus: this.subscriptionStatus() } : {}),
      ...(this.invoiceStatus() ? { invoiceStatus: this.invoiceStatus() } : {}),
      ...(this.paymentStatus() ? { paymentStatus: this.paymentStatus() } : {}),
      ...(this.billingPeriod() ? { billingPeriod: this.billingPeriod() } : {}),
    };
  }

  async applyFilters() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(this.api.page(this.filterPayload()));
      if (!res.success) throw new Error(res.message);
      this.pageData.set(res.data);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Failed to load reports');
      this.pageData.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  resetFilters() {
    const r = defaultRange();
    this.fromDate.set(r.from);
    this.toDate.set(r.to);
    this.customerId.set('');
    this.productId.set('');
    this.planId.set('');
    this.subscriptionStatus.set('');
    this.invoiceStatus.set('');
    this.paymentStatus.set('');
    this.billingPeriod.set('');
    void this.applyFilters();
  }

  toggleNavDropdown(event: Event, label: string) {
    event.stopPropagation();
    this.navDropdownOpenKey.update((k) => (k === label ? null : label));
  }

  onNavClick(item: { label: string }) {
    this.navItems.set(this.navItems().map((i) => ({ ...i, active: i.label === item.label })));
  }

  barHeight(item: RevenueTrendItem): number {
    return Math.round((item.revenue / this.maxRevenue()) * 100);
  }

  overdueBarHeight(amount: number): number {
    return Math.round((amount / this.maxOverdueAmt()) * 100);
  }

  donutGradient(items: StatusCountItem[]): string {
    const total = items.reduce((s, i) => s + i.count, 0) || 1;
    let acc = 0;
    const segs = items.map((it, i) => {
      const pct = (it.count / total) * 100;
      const c = CHART_COLORS[i % CHART_COLORS.length];
      const start = acc;
      acc += pct;
      return `${c} ${start}% ${acc}%`;
    });
    return `conic-gradient(${segs.join(', ')})`;
  }

  async downloadCsv(type: 'revenue' | 'revenue_table' | 'payments' | 'subscriptions' | 'invoices') {
    try {
      const csv = await firstValueFrom(this.api.exportCsv(type, this.filterPayload()));
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${type}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      this.error.set('Export failed');
    }
  }

  printPage() {
    window.print();
  }

  exportExcel() {
    void this.downloadCsv('revenue_table');
  }

  exportPdf() {
    window.print();
  }

  legendColor(i: number): string {
    return CHART_COLORS[i % CHART_COLORS.length];
  }
}
