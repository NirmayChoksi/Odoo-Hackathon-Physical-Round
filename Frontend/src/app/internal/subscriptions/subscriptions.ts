import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { INTERNAL_DASHBOARD_NAV_BASE } from '../../external/ecommerce-navigation';
import {
  CONFIGURATION_DROPDOWN_ITEMS,
  SUBSCRIPTION_APP_BASE,
  SUBSCRIPTION_APP_PATHS,
  USERS_CONTACTS_DROPDOWN_ITEMS,
} from '../subscription-app.constants';

export interface Subscription {
  number: string;
  customer: string;
  nextInvoice: string;
  recurring: string;
  plan: string;
  status: 'In progress' | 'Churned' | 'Quotation Sent' | 'Pending';
}

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './subscriptions.html',
  styleUrl: './subscriptions.css'
})
export class SubscriptionsComponent {
  // Navigation State
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

  // Data State
  subscriptionsList = signal<Subscription[]>([
    { number: 'S0001', customer: 'Customer 1', nextInvoice: 'Feb 14, 2026', recurring: '₹140.00', plan: 'Monthly', status: 'In progress' },
    { number: 'S0002', customer: 'Customer 2', nextInvoice: 'Feb 18, 2026', recurring: '₹116.00', plan: 'Monthly', status: 'Churned' },
    { number: 'S0003', customer: 'Customer 3', nextInvoice: 'Feb 10, 2026', recurring: '₹230.00', plan: 'Yearly', status: 'Quotation Sent' },
    { number: 'S0004', customer: 'Architects Inc.', nextInvoice: 'Mar 1, 2026', recurring: '₹450.00', plan: 'Yearly', status: 'In progress' },
    { number: 'S0005', customer: 'Design Studio B', nextInvoice: 'Feb 28, 2026', recurring: '₹120.00', plan: 'Monthly', status: 'Pending' }
  ]);

  // Search/Filter State
  searchQuery = signal('');
  navDropdownOpenKey = signal<string | null>(null);

  // Computed filtered list
  filteredSubscriptions = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.subscriptionsList();
    return this.subscriptionsList().filter(sub => 
      sub.number.toLowerCase().includes(query) || 
      sub.customer.toLowerCase().includes(query) ||
      sub.status.toLowerCase().includes(query)
    );
  });

  constructor(private router: Router) {
    window.addEventListener('click', () => {
      this.navDropdownOpenKey.set(null);
    });
  }

  toggleNavDropdown(event: Event, label: string) {
    event.stopPropagation();
    this.navDropdownOpenKey.update((k) => (k === label ? null : label));
  }

  onNavClick(item: any) {
    const items = this.navItems().map(i => ({ ...i, active: i.label === item.label }));
    this.navItems.set(items);
  }

  onSearch(event: any) {
    this.searchQuery.set(event.target.value);
  }

  /** Staff storefront lives under `/dashboard/internal`; subscription UI under `/subscription`. */
  private staffStorefrontBase(): string | null {
    const url = this.router.url.split('?')[0];
    if (url.startsWith('/dashboard/internal') || url.startsWith(SUBSCRIPTION_APP_BASE)) {
      return INTERNAL_DASHBOARD_NAV_BASE;
    }
    return null;
  }

  subsHomeLink(): string {
    return SUBSCRIPTION_APP_PATHS.subscriptions;
  }

  shopLink(): string {
    const b = this.staffStorefrontBase();
    return b ? `${b}/shop` : '/shop';
  }

  accountLink(): string {
    const b = this.staffStorefrontBase();
    return b ? `${b}/account` : '/account';
  }

  onNewSubscription() {
    void this.router.navigate([SUBSCRIPTION_APP_PATHS.subscriptionsNew]);
  }

  onDelete() {
    alert('Select rows to perform delete action.');
  }

  onSettings() {
    alert('Subscription configuration settings.');
  }
}
