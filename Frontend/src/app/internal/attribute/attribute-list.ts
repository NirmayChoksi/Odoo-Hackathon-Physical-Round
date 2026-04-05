import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  CONFIGURATION_DROPDOWN_ITEMS,
  SUBSCRIPTION_APP_PATHS,
  subscriptionAttributeDetailPath,
  USERS_CONTACTS_DROPDOWN_ITEMS,
} from '../subscription-app.constants';
import { AttributeApiService } from './attribute-api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-attribute-list',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './attribute-list.html',
  styleUrl: './attribute-list.css'
})
export class AttributeListComponent implements OnInit {
  private readonly api = inject(AttributeApiService);

  readonly paths = SUBSCRIPTION_APP_PATHS;
  readonly attributeDetailPath = subscriptionAttributeDetailPath;

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

  // Table Data
  attributes = signal<any[]>([]);
  isLoading = signal(false);
  searchQuery = signal('');

  async ngOnInit() {
    await this.loadAttributes();
  }

  async loadAttributes() {
    this.isLoading.set(true);
    try {
      const res = await firstValueFrom(this.api.list());
      if (res.success) {
        this.attributes.set(res.data.map((a: any) => ({
          id: a.attribute_id,
          name: a.display_name,
          values: a.values?.map((v: any) => v.value_name).join(', ') || ''
        })));
      }
    } catch (err) {
      console.error('Failed to load attributes', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  isConfigOpen = signal(false);

  onNavClick(item: any) {
    const items = this.navItems().map((i: any) => ({ ...i, active: i.label === item.label }));
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
