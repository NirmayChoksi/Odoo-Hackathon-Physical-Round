import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './configuration.html',
  styleUrl: './configuration.css'
})
export class ConfigurationComponent {
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

  searchQuery = signal('');

  /** Mock rows — mockup example: attribute name brand, value color, extra price */
  rows = signal([
    { id: '1', attributeName: 'brand', value: 'color', extraPrice: '20 R.s' },
    { id: '2', attributeName: '', value: '', extraPrice: '' },
    { id: '3', attributeName: '', value: '', extraPrice: '' },
    { id: '4', attributeName: '', value: '', extraPrice: '' },
    { id: '5', attributeName: '', value: '', extraPrice: '' },
    { id: '6', attributeName: '', value: '', extraPrice: '' }
  ]);

  filteredRows = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.rows();
    return this.rows().filter(
      r =>
        r.attributeName.toLowerCase().includes(q) ||
        r.value.toLowerCase().includes(q) ||
        r.extraPrice.toLowerCase().includes(q)
    );
  });

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

  onNavClick(item: { label: string }) {
    const items = this.navItems().map(i => ({ ...i, active: i.label === item.label }));
    this.navItems.set(items);
  }

  onDelete() {
    /* placeholder */
  }

  onGridAction() {
    /* placeholder — mockup secondary toolbar icon */
  }
}
