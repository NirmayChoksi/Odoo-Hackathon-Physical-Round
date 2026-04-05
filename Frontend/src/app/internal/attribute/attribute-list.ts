import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  CONFIGURATION_DROPDOWN_ITEMS,
  SUBSCRIPTION_APP_PATHS,
  subscriptionAttributeDetailPath,
  USERS_CONTACTS_DROPDOWN_ITEMS,
} from '../subscription-app.constants';
import { AttributeStore } from './attribute.store';
import { computed } from '@angular/core';

@Component({
  selector: 'app-attribute-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './attribute-list.html',
  styleUrl: './attribute-list.css'
})
export class AttributeListComponent implements OnInit {
  readonly store = inject(AttributeStore);

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

  isLoading = this.store.isLoading;
  searchQuery = signal('');

  attributes = computed(() => {
    return this.store.attributes().map((a: any) => ({
      id: a.attribute_id,
      name: a.name || a.display_name,
      values: a.values?.map((v: any) => v.value || v.value_name).join(', ') || ''
    }));
  });

  async ngOnInit() {
    await this.store.loadAll();
  }

}
