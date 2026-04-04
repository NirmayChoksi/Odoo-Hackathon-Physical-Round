import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  CONFIGURATION_DROPDOWN_ITEMS,
  CONFIGURATION_HUB_MODULES,
  SUBSCRIPTION_APP_PATHS,
  USERS_CONTACTS_DROPDOWN_ITEMS,
} from '../subscription-app.constants';

@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './configuration.html',
  styleUrl: './configuration.css'
})
export class ConfigurationComponent {
  readonly paths = SUBSCRIPTION_APP_PATHS;
  readonly hubModules = CONFIGURATION_HUB_MODULES;

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
