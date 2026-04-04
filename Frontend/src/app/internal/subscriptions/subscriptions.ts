import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

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
  imports: [CommonModule, RouterLink],
  templateUrl: './subscriptions.html',
  styleUrl: './subscriptions.css'
})
export class SubscriptionsComponent {
  
  // Navigation State
  navItems = signal([
    { label: 'Subscriptions', active: true },
    { label: 'Products', active: false },
    { label: 'Reporting', active: false },
    { label: 'Users/Contacts', active: false },
    { label: 'Configuration', active: false }
  ]);

  // Data State
  subscriptionsList = signal<Subscription[]>([
    { number: 'S0001', customer: 'Customer 1', nextInvoice: 'Feb 14, 2026', recurring: '$140.00', plan: 'Monthly', status: 'In progress' },
    { number: 'S0002', customer: 'Customer 2', nextInvoice: 'Feb 18, 2026', recurring: '$116.00', plan: 'Monthly', status: 'Churned' },
    { number: 'S0003', customer: 'Customer 3', nextInvoice: 'Feb 10, 2026', recurring: '$230.00', plan: 'Yearly', status: 'Quotation Sent' },
    { number: 'S0004', customer: 'Architects Inc.', nextInvoice: 'Mar 1, 2026', recurring: '$450.00', plan: 'Yearly', status: 'In progress' },
    { number: 'S0005', customer: 'Design Studio B', nextInvoice: 'Feb 28, 2026', recurring: '$120.00', plan: 'Monthly', status: 'Pending' }
  ]);

  // Search/Filter State
  searchQuery = signal('');

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

  onSearch(event: any) {
    this.searchQuery.set(event.target.value);
  }

  onNewSubscription() {
    alert('Feature coming soon: Create New Subscription');
  }

  onDelete() {
    alert('Select rows to perform delete action.');
  }

  onSettings() {
    alert('Subscription configuration settings.');
  }
}
