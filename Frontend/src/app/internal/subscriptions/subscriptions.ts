import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { INTERNAL_DASHBOARD_NAV_BASE } from '../../external/ecommerce-navigation';
import {
  CONFIGURATION_DROPDOWN_ITEMS,
  SUBSCRIPTION_APP_BASE,
  SUBSCRIPTION_APP_PATHS,
  USERS_CONTACTS_DROPDOWN_ITEMS,
} from '../subscription-app.constants';

const API = '/api/internal/subscriptions';

interface SubscriptionRow {
  subscription_id: number;
  subscription_number: string;
  customer_id: number;
  customer_name: string;
  plan_id: number;
  start_date: string;
  expiration_date: string | null;
  status: string;
  total_amount: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  QUOTATION: 'Quotation',
  CONFIRMED: 'Confirmed',
  ACTIVE: 'Active',
  CLOSED: 'Closed',
};

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './subscriptions.html',
  styleUrl: './subscriptions.css',
})
export class SubscriptionsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // Navigation state
  navItems = signal([
    { label: 'Subscriptions', active: true, path: SUBSCRIPTION_APP_PATHS.subscriptions },
    { label: 'Products', active: false, path: SUBSCRIPTION_APP_PATHS.products },
    { label: 'Reporting', active: false, path: SUBSCRIPTION_APP_PATHS.reporting },
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

  // Data state
  subscriptionsList = signal<SubscriptionRow[]>([]);
  total = signal(0);
  page = signal(1);
  readonly pageSize = 20;
  isLoading = signal(false);
  loadError = signal<string | null>(null);

  // Filters
  searchQuery = signal('');
  selectedStatus = signal('');

  totalPages = computed(() => Math.ceil(this.total() / this.pageSize) || 1);

  filteredSubscriptions = computed(() => this.subscriptionsList());

  async ngOnInit() {
    await this.loadPage(1);
    window.addEventListener('click', () => this.navDropdownOpenKey.set(null));
  }

  async loadPage(pg: number) {
    this.isLoading.set(true);
    this.loadError.set(null);
    try {
      let params = new HttpParams()
        .set('page', String(pg))
        .set('limit', String(this.pageSize));
      if (this.selectedStatus()) params = params.set('status', this.selectedStatus());
      if (this.searchQuery().trim()) params = params.set('search', this.searchQuery().trim());
      const res = await firstValueFrom(
        this.http.get<{
          success: boolean;
          data: { subscriptions: SubscriptionRow[]; pagination: { total: number } };
        }>(API, { params })
      );
      this.subscriptionsList.set(res.data?.subscriptions ?? []);
      this.total.set(res.data?.pagination?.total ?? 0);
      this.page.set(pg);
    } catch (e: any) {
      this.loadError.set(e?.error?.message || e?.message || 'Failed to load subscriptions');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onStatusFilter(status: string) {
    this.selectedStatus.set(status);
    await this.loadPage(1);
  }

  prevPage() {
    if (this.page() > 1) void this.loadPage(this.page() - 1);
  }
  nextPage() {
    if (this.page() < this.totalPages()) void this.loadPage(this.page() + 1);
  }

  private searchTimeout?: any;
  onSearch(event: any) {
    const val = event.target.value;
    this.searchQuery.set(val);
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      void this.loadPage(1);
    }, 400);
  }

  toggleNavDropdown(event: Event, label: string) {
    event.stopPropagation();
    this.navDropdownOpenKey.update((k) => (k === label ? null : label));
  }

  onNavClick(item: any) {
    this.navItems.set(this.navItems().map((i) => ({ ...i, active: i.label === item.label })));
  }

  onNewSubscription() {
    void this.router.navigate([SUBSCRIPTION_APP_PATHS.subscriptionsNew]);
  }

  goToSubscription(id: number) {
    void this.router.navigate([SUBSCRIPTION_APP_PATHS.subscriptionsNew], {
      queryParams: { id },
    });
  }

  formatSubscriptionNumber(raw: string | number): string {
    const s = String(raw);
    return s.startsWith('SO') ? s : `SO${s}`;
  }

  statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  // Kept for template compatibility
  subsHomeLink = () => SUBSCRIPTION_APP_PATHS.subscriptions;
  shopLink = () => `${INTERNAL_DASHBOARD_NAV_BASE}/shop`;
  accountLink = () => `${INTERNAL_DASHBOARD_NAV_BASE}/account`;
  onDelete = () => alert('Select rows to perform delete action.');
  onSettings = () => alert('Subscription configuration settings.');
}
