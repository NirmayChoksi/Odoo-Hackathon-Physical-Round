import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-recurring-plan',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './recurring-plan.html',
  styleUrl: './recurring-plan.css'
})
export class RecurringPlanComponent {

  // Navigation State
  navItems = signal([
    { label: 'Subscriptions', active: false, path: '/subscriptions' },
    { label: 'Products', active: false, path: '/products' },
    { label: 'Reporting', active: false, path: '/reporting' },
    { label: 'Users/Contacts', active: false, path: '/users' },
    { 
      label: 'Configuration', 
      active: true, 
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

  // Form State
  planName = signal<string>('');
  billingValue = signal<number | null>(null);
  billingUnit = signal<string>('Month');
  autoCloseDays = signal<number | null>(null);
  
  closable = signal<boolean>(false);
  pausable = signal<boolean>(false);
  renew = signal<boolean>(false);

  units = ['Weeks', 'Month', 'Year'];

  // Table Data
  products = signal([
    { product: 'demo', variant: '', price: 'eg. 4 rs per week', minQty: '1 qty' }
  ]);

  isConfigOpen = signal(false);

  onNew() {
    alert('Create New Plan');
  }

  onDelete() {
    alert('Delete Plan');
  }

  onSave() {
    alert('Save Plan');
  }

  toggleConfig(event: Event) {
    event.stopPropagation();
    this.isConfigOpen.set(!this.isConfigOpen());
  }

  // Close dropdown when clicking elsewhere
  constructor() {
    window.addEventListener('click', () => {
      this.isConfigOpen.set(false);
    });
  }

  onSubscriptionClick() {
    alert('View Linked Subscriptions');
  }

  onNavClick(item: any) {
    const items = this.navItems().map(i => ({ ...i, active: i.label === item.label }));
    this.navItems.set(items);
  }

  addProductRow() {
    this.products.set([...this.products(), { product: '', variant: '', price: '', minQty: '' }]);
  }
}
