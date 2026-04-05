import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RecurringPlanApiService } from './recurring-plan-api.service';
import { firstValueFrom } from 'rxjs';
import {
  CONFIGURATION_DROPDOWN_ITEMS,
  SUBSCRIPTION_APP_PATHS,
  USERS_CONTACTS_DROPDOWN_ITEMS,
} from '../subscription-app.constants';

@Component({
  selector: 'app-recurring-plan',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './recurring-plan.html',
  styleUrl: './recurring-plan.css'
})
export class RecurringPlanComponent implements OnInit {
  private readonly api = inject(RecurringPlanApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  planId = signal<number | null>(null);
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
  planName = signal<string>('');
  billingValue = signal<number | null>(null);
  billingUnit = signal<string>('Month');
  autoCloseDays = signal<number | null>(null);
  
  closable = signal<boolean>(false);
  pausable = signal<boolean>(false);
  renew = signal<boolean>(false);

  units = ['Weeks', 'Month', 'Year'];

  // Table Data (linked products - read-only for now or simple mock)
  products = signal<any[]>([]);

  isConfigOpen = signal(false);

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.planId.set(Number(id));
      await this.loadPlan(this.planId()!);
    }
  }

  async loadPlan(id: number) {
    this.isLoading.set(true);
    try {
      const res = await firstValueFrom(this.api.get(id));
      if (res.success) {
        const p = res.data;
        this.planName.set(p.plan_name);
        this.billingValue.set(1); // Backend stores period, but UI has value + unit
        this.billingUnit.set(this.mapPeriodToUnit(p.billing_period));
        this.autoCloseDays.set(p.auto_close ? 0 : null); // Simple mapping
        this.closable.set(p.closable);
        this.pausable.set(p.pausable);
        this.renew.set(p.renewable);
      }
    } catch (err) {
      console.error('Failed to load plan', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  mapPeriodToUnit(period: string): string {
    if (period === 'WEEKLY') return 'Weeks';
    if (period === 'YEARLY') return 'Year';
    return 'Month';
  }

  mapUnitToPeriod(value: number, unit: string): string {
    if (unit === 'Weeks') return 'WEEKLY';
    if (unit === 'Year') return 'YEARLY';
    return 'MONTHLY';
  }

  onNew() {
    this.planId.set(null);
    this.planName.set('');
    this.billingValue.set(null);
    this.closable.set(false);
    this.pausable.set(false);
    this.renew.set(false);
    this.products.set([]);
  }

  async onDelete() {
    if (!this.planId()) return;
    if (!confirm('Are you sure you want to delete this plan?')) return;
    
    try {
      await firstValueFrom(this.api.remove(this.planId()!));
      alert('Plan deleted');
      this.router.navigate([SUBSCRIPTION_APP_PATHS.configuration]);
    } catch (err) {
      alert('Delete failed');
    }
  }

  async onSave() {
    const body = {
      planName: this.planName(),
      price: 0, // Default for now
      billingPeriod: this.mapUnitToPeriod(this.billingValue() || 1, this.billingUnit()),
      minimumQuantity: 1,
      closable: this.closable(),
      pausable: this.pausable(),
      renewable: this.renew(),
      status: 'ACTIVE'
    };

    try {
      if (this.planId()) {
        await firstValueFrom(this.api.update(this.planId()!, body));
        alert('Plan updated');
      } else {
        const res = await firstValueFrom(this.api.create(body));
        alert('Plan created');
        this.planId.set(res.data.planId);
      }
    } catch (err) {
      alert('Save failed');
    }
  }

  toggleConfig(event: Event) {
    event.stopPropagation();
    this.isConfigOpen.set(!this.isConfigOpen());
  }

  // Close dropdown when clicking elsewhere
  constructor() {
    window.addEventListener('click', () => {
      this.isConfigOpen.set(false);
    });
  }

  onSubscriptionClick() {
    alert('View Linked Subscriptions');
  }

  onNavClick(item: any) {
    const items = this.navItems().map((i: any) => ({ ...i, active: i.label === item.label }));
    this.navItems.set(items);
  }

  addProductRow() {
    this.products.set([...this.products(), { product: '', variant: '', price: '', minQty: '' }]);
  }
}
