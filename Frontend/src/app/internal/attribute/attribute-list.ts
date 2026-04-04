import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-attribute-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './attribute-list.html',
  styleUrl: './attribute-list.css'
})
export class AttributeListComponent {

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
