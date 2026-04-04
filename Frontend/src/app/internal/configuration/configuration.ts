import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SUBSCRIPTION_APP_PATHS } from '../subscription-app.constants';

@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './configuration.html',
  styleUrl: './configuration.css'
})
export class ConfigurationComponent {
  readonly paths = SUBSCRIPTION_APP_PATHS;

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
