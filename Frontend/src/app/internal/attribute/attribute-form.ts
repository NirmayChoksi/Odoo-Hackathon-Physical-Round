import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  CONFIGURATION_DROPDOWN_ITEMS,
  SUBSCRIPTION_APP_PATHS,
  USERS_CONTACTS_DROPDOWN_ITEMS,
} from '../subscription-app.constants';
import { AttributeApiService } from './attribute-api.service';
import { firstValueFrom } from 'rxjs';

export interface AttributeValue {
  id?: number;
  value: string;
  extraPrice: string | number;
}

@Component({
  selector: 'app-attribute-form',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './attribute-form.html',
  styleUrl: './attribute-form.css'
})
export class AttributeFormComponent implements OnInit {
  private readonly api = inject(AttributeApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  attributeId = signal<number | null>(null);
  isLoading = signal(false);

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
  attributeName = signal<string>('');
  isConfigOpen = signal(false);
  
  // Table Data
  attributeValues = signal<AttributeValue[]>([]);

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.attributeId.set(Number(id));
      await this.loadAttribute(this.attributeId()!);
    } else {
      this.attributeValues.set([{ value: '', extraPrice: '' }]);
    }
  }

  async loadAttribute(id: number) {
    this.isLoading.set(true);
    try {
      const res = await firstValueFrom(this.api.get(id));
      if (res.success) {
        const a = res.data;
        this.attributeName.set(a.display_name);
        if (a.values) {
          this.attributeValues.set(a.values.map((v: any) => ({
            id: v.value_id,
            value: v.value_name,
            extraPrice: v.extra_price || ''
          })));
        }
      }
    } catch (err) {
      console.error('Failed to load attribute', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  onNew() {
    this.attributeId.set(null);
    this.attributeName.set('');
    this.attributeValues.set([{ value: '', extraPrice: '' }]);
  }

  async onDelete() {
    if (!this.attributeId()) return;
    if (!confirm('Are you sure you want to delete this attribute?')) return;
    
    try {
      await firstValueFrom(this.api.remove(this.attributeId()!));
      alert('Attribute deleted');
      this.router.navigate([SUBSCRIPTION_APP_PATHS.attribute]);
    } catch (err) {
      alert('Delete failed');
    }
  }

  async onSave() {
    const body = {
      name: this.attributeName(),
      values: this.attributeValues()
        .filter(v => v.value.trim() !== '')
        .map(v => ({
          valueName: v.value,
          extraPrice: Number(v.extraPrice) || 0
        }))
    };

    try {
      if (this.attributeId()) {
        await firstValueFrom(this.api.update(this.attributeId()!, body));
        alert('Attribute updated');
      } else {
        const res = await firstValueFrom(this.api.create(body));
        alert('Attribute created');
        this.attributeId.set(res.data.attributeId);
      }
    } catch (err) {
      alert('Save failed');
    }
  }

  constructor() {
    window.addEventListener('click', () => {
      this.isConfigOpen.set(false);
    });
  }

  onNavClick(item: any) {
    const items = this.navItems().map((i: any) => ({ ...i, active: i.label === item.label }));
    this.navItems.set(items);
  }

  toggleConfig(event: Event) {
    event.stopPropagation();
    this.isConfigOpen.set(!this.isConfigOpen());
  }

  addValueRow() {
    this.attributeValues.set([...this.attributeValues(), { value: '', extraPrice: '' }]);
  }
}
