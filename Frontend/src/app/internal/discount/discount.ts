import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SUBSCRIPTION_APP_PATHS } from '../subscription-app.constants';

@Component({
  selector: 'app-discount',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    FormsModule
  ],
  templateUrl: './discount.html',
  styleUrl: './discount.css'
})
export class DiscountComponent {
  
  // Navigation State
  navItems = signal([
    { label: 'Subscriptions', active: false, path: SUBSCRIPTION_APP_PATHS.subscriptions },
    { label: 'Products', active: false, path: SUBSCRIPTION_APP_PATHS.products },
    { label: 'Reporting', active: false, path: SUBSCRIPTION_APP_PATHS.reporting },
    { label: 'Users/Contacts', active: false, path: SUBSCRIPTION_APP_PATHS.users },
    {
      label: 'Configuration',
      active: true,
      isDropdown: true,
      dropdownItems: [
        { label: 'Overview', path: SUBSCRIPTION_APP_PATHS.configuration },
        { label: 'Attribute', path: SUBSCRIPTION_APP_PATHS.attribute },
        { label: 'Recurring Plan', path: SUBSCRIPTION_APP_PATHS.recurringPlan },
        { label: 'Quotation Template', path: SUBSCRIPTION_APP_PATHS.quotationTemplate },
        { label: 'Payment term', path: SUBSCRIPTION_APP_PATHS.paymentTerm },
        { label: 'Discount', path: SUBSCRIPTION_APP_PATHS.discount },
        { label: 'Taxes', path: SUBSCRIPTION_APP_PATHS.taxes },
      ],
    },
  ]);

  // Form State
  discountName = signal<string>('');
  discountType = signal<string>('Percentage');
  minimumPurchase = signal<number | null>(null);
  minimumQuantity = signal<number | null>(null);
  products = signal<string>('');
  
  startDate = signal<string>('');
  endDate = signal<string>('');
  limitUsage = signal<boolean>(false);
  limitUsageCount = signal<number | null>(null);

  discountTypes = ['Fixed Price', 'Percentage'];

  onNew() {
    alert('Create New Discount');
  }

  onDelete() {
    alert('Delete Discount');
  }

  onSave() {
    alert('Save Discount');
  }

  isConfigOpen = signal(false);

  toggleConfig(event: Event) {
    event.stopPropagation();
    this.isConfigOpen.set(!this.isConfigOpen());
  }

  constructor() {
    window.addEventListener('click', () => {
      this.isConfigOpen.set(false);
    });
  }

  onNavClick(item: any) {
    const items = this.navItems().map(i => ({ ...i, active: i.label === item.label }));
    this.navItems.set(items);
  }
}
