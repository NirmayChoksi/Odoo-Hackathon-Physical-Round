import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  CONFIGURATION_DROPDOWN_ITEMS,
  SUBSCRIPTION_APP_PATHS,
  USERS_CONTACTS_DROPDOWN_ITEMS,
} from '../subscription-app.constants';

@Component({
  selector: 'app-recurring-plan',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './recurring-plan.html',
  styleUrl: './recurring-plan.css'
})
export class RecurringPlanComponent {

  // Navigation State
  navItems = signal([
    { label: 'Subscriptions', active: false, path: SUBSCRIPTION_APP_PATHS.subscriptions },
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
      active: true,
      isDropdown: true,
      dropdownItems: [...CONFIGURATION_DROPDOWN_ITEMS],
    },
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
