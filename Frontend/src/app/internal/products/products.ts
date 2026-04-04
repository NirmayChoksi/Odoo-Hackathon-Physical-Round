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
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './products.html',
  styleUrl: './products.css'
})
export class ProductsComponent {

  // Navigation State
  navItems = signal([
    { label: 'Subscriptions', active: false, path: SUBSCRIPTION_APP_PATHS.subscriptions },
    { label: 'Products', active: true, path: SUBSCRIPTION_APP_PATHS.products },
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

  // Form State
  productName = signal<string>('');
  salesPrice = signal<number | null>(null);
  category = signal<string>('Services');
  internalReference = signal<string>('');

  categories = ['Services', 'Consumable', 'Storable Product'];

  onNew() {
    alert('Create New Product');
  }

  onDelete() {
    alert('Delete Product');
  }

  onSave() {
    alert('Save Product');
  }

  navDropdownOpenKey = signal<string | null>(null);

  toggleNavDropdown(event: Event, label: string) {
    event.stopPropagation();
    this.navDropdownOpenKey.update((k) => (k === label ? null : label));
  }

  constructor() {
    window.addEventListener('click', () => {
      this.navDropdownOpenKey.set(null);
    });
  }

  onNavClick(item: any) {
    const items = this.navItems().map(i => ({ ...i, active: i.label === item.label }));
    this.navItems.set(items);
  }
}
