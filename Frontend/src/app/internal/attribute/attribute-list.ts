import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SUBSCRIPTION_APP_PATHS, subscriptionAttributeDetailPath } from '../subscription-app.constants';

@Component({
  selector: 'app-attribute-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './attribute-list.html',
  styleUrl: './attribute-list.css'
})
export class AttributeListComponent {
  readonly paths = SUBSCRIPTION_APP_PATHS;
  readonly attributeDetailPath = subscriptionAttributeDetailPath;

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

  // Table Data
  attributes = signal([
    { id: '1', name: 'Brand', values: 'Odoo, SubSync, Custom' },
    { id: '2', name: 'Color', values: 'Red, Blue, Green' },
    { id: '3', name: 'Size', values: 'Small, Medium, Large' }
  ]);

  searchQuery = signal('');

  onNew() {
    // Navigation would normally go to /attribute/new
  }

  isConfigOpen = signal(false);

  onNavClick(item: any) {
    const items = this.navItems().map(i => ({ ...i, active: i.label === item.label }));
    this.navItems.set(items);
  }

  toggleConfig(event: Event) {
    event.stopPropagation();
    this.isConfigOpen.set(!this.isConfigOpen());
  }

  constructor() {
    window.addEventListener('click', () => {
      this.isConfigOpen.set(false);
    });
  }
}
