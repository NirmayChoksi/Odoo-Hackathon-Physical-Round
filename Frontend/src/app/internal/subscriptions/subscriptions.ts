import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';

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
    { label: 'Subscriptions', active: true, path: '/subscriptions' },
    { label: 'Products', active: false, path: '/products' },
    { label: 'Reporting', active: false, path: '/reporting' },
    { label: 'Users/Contacts', active: false, path: '/users' },
    { 
      label: 'Configuration', 
      active: false, 
      isDropdown: true,
      dropdownItems: [
        { label: 'Overview', path: '/configuration' },
        { label: 'Attribute', path: '/attribute' },
        { label: 'Recurring Plan', path: '/recurring-plan' },
        { label: 'Quotation Template', path: '/quotation-template' },
        { label: 'Payment term', path: '/payment-term' },
        { label: 'Discount', path: '/discount' },
        { label: 'Taxes', path: '/taxes' }
      ]
    }
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
  isConfigOpen = signal(false);

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
      this.isConfigOpen.set(false);
    });
  }

  toggleConfig(event: Event) {
    event.stopPropagation();
    this.isConfigOpen.set(!this.isConfigOpen());
  }

  onNavClick(item: any) {
    const items = this.navItems().map(i => ({ ...i, active: i.label === item.label }));
    this.navItems.set(items);
  }

  onSearch(event: any) {
    this.searchQuery.set(event.target.value);
  }

  /** When embedded under `/dashboard/internal`, storefront links use this prefix. */
  private navPrefix(): string {
    return this.router.url.split('?')[0].startsWith('/dashboard/internal') ? '/dashboard/internal' : '';
  }

  subsHomeLink(): string {
    return this.navPrefix() || '/subscriptions';
  }

  shopLink(): string {
    const p = this.navPrefix();
    return p ? `${p}/shop` : '/shop';
  }

  accountLink(): string {
    const p = this.navPrefix();
    return p ? `${p}/account` : '/account';
  }

  onNewSubscription() {
    this.router.navigate(['/subscriptions/new']);
  }

  onDelete() {
    alert('Select rows to perform delete action.');
  }

  onSettings() {
    alert('Subscription configuration settings.');
  }
}
