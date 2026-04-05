import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  CONFIGURATION_DROPDOWN_ITEMS,
  SUBSCRIPTION_APP_PATHS,
  USERS_CONTACTS_DROPDOWN_ITEMS,
} from '../subscription-app.constants';
import { TaxApiService } from './tax-api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-taxes',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './taxes.html',
  styleUrl: './taxes.css'
})
export class TaxesComponent implements OnInit {
  private readonly api = inject(TaxApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  taxId = signal<number | null>(null);
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
  taxName = signal<string>('');
  taxComputation = signal<'Percentage' | 'Fixed Price'>('Percentage');
  amount = signal<number | null>(null);

  computationTypes: Array<'Percentage' | 'Fixed Price'> = ['Percentage', 'Fixed Price'];

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.taxId.set(Number(id));
      await this.loadTax(this.taxId()!);
    }
  }

  async loadTax(id: number) {
    this.isLoading.set(true);
    try {
      const res = await firstValueFrom(this.api.get(id));
      if (res.success) {
        const t = res.data;
        this.taxName.set(t.tax_name);
        this.taxComputation.set(t.tax_type === 'PERCENTAGE' ? 'Percentage' : 'Fixed Price');
        this.amount.set(Number(t.tax_percentage));
      }
    } catch (err) {
      console.error('Failed to load tax', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  onNew() {
    this.taxId.set(null);
    this.taxName.set('');
    this.taxComputation.set('Percentage');
    this.amount.set(null);
  }

  async onDelete() {
    if (!this.taxId()) return;
    if (!confirm('Are you sure you want to delete this tax?')) return;
    
    try {
      await firstValueFrom(this.api.remove(this.taxId()!));
      alert('Tax deleted');
      this.router.navigate([SUBSCRIPTION_APP_PATHS.configuration]);
    } catch (err) {
      alert('Delete failed');
    }
  }

  async onSave() {
    const body = {
      taxName: this.taxName(),
      taxType: this.taxComputation() === 'Percentage' ? 'PERCENTAGE' : 'FIXED',
      taxPercentage: this.amount() || 0,
      status: 'ACTIVE'
    };

    try {
      if (this.taxId()) {
        await firstValueFrom(this.api.update(this.taxId()!, body));
        alert('Tax updated');
      } else {
        const res = await firstValueFrom(this.api.create(body));
        alert('Tax created');
        this.taxId.set(res.data.taxId);
      }
    } catch (err) {
      alert('Save failed');
    }
  }

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

  onNavClick(item: any) {
    const items = this.navItems().map((i: any) => ({ ...i, active: i.label === item.label }));
    this.navItems.set(items);
  }
}
