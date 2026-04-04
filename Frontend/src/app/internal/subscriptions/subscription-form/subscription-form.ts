import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PaymentTermApiService } from '../../payment-term/payment-term-api.service';
import {
  CONFIGURATION_DROPDOWN_ITEMS,
  SUBSCRIPTION_APP_PATHS,
  USERS_CONTACTS_DROPDOWN_ITEMS,
} from '../../subscription-app.constants';

@Component({
  selector: 'app-subscription-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './subscription-form.html',
  styleUrl: './subscription-form.css'
})
export class SubscriptionFormComponent {
  private readonly paymentTermApi = inject(PaymentTermApiService);

  readonly paths = SUBSCRIPTION_APP_PATHS;

  navItems = signal([
    { label: 'Subscriptions', active: true, path: SUBSCRIPTION_APP_PATHS.subscriptions },
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
      active: false,
      isDropdown: true,
      dropdownItems: [...CONFIGURATION_DROPDOWN_ITEMS],
    },
  ]);

  /** Which nav dropdown is open (`item.label`), so Users/Contacts and Configuration do not share one flag. */
  navDropdownOpenKey = signal<string | null>(null);

  statusFlow = signal(['Quotation', 'Quotation Sent', 'Confirmed']);
  currentStatus = signal('Quotation');

  activeTab = signal<'order-lines' | 'other-info'>('order-lines');

  subscriptionNumber = signal('SO0001');

  customerOptions = signal([
    { value: '1', label: 'Existing Customer 1' },
    { value: '2', label: 'Existing Customer 2' }
  ]);

  templateOptions = signal([
    { value: 'monthly', label: 'Monthly Subscription' },
    { value: 'yearly', label: 'Yearly Subscription' }
  ]);

  recurringPlanOptions = signal([
    { value: 'basic', label: 'Basic Plan' },
    { value: 'premium', label: 'Premium Plan' }
  ]);

  paymentTermOptions = signal<{ value: string; label: string }[]>([
    { value: '', label: 'Select payment term' },
  ]);

  customerId = signal('');
  templateId = signal('');
  expiration = signal('');
  recurringPlanId = signal('');
  paymentTermId = signal('');

  orderLines = signal([
    { product: 'demo', quantity: 1, unitPrice: 100, discount: 0, taxes: 0, amount: 100 }
  ]);

  constructor() {
    window.addEventListener('click', () => this.navDropdownOpenKey.set(null));
    void this.loadPaymentTerms();
  }

  private async loadPaymentTerms() {
    try {
      const res = await firstValueFrom(this.paymentTermApi.list(1, 100, undefined, 'ACTIVE'));
      if (!res.success) return;
      const opts = [
        { value: '', label: 'Select payment term' },
        ...res.data.terms.map((t) => ({ value: String(t.paymentTermId), label: t.termName })),
      ];
      this.paymentTermOptions.set(opts);
    } catch {
      /* offline or not staff — keep placeholder */
    }
  }

  toggleNavDropdown(event: Event, label: string) {
    event.stopPropagation();
    this.navDropdownOpenKey.update((k) => (k === label ? null : label));
  }

  onNavClick(item: { label: string }) {
    const items = this.navItems().map(i => ({ ...i, active: i.label === item.label }));
    this.navItems.set(items);
  }

  onTabClick(tabId: 'order-lines' | 'other-info') {
    this.activeTab.set(tabId);
  }

  onSave() {
    alert('Subscription saved');
  }

  onSend() {
    this.currentStatus.set('Quotation Sent');
  }

  onConfirm() {
    this.currentStatus.set('Confirmed');
  }

  isStepComplete(step: string): boolean {
    const order = this.statusFlow();
    const curIdx = order.indexOf(this.currentStatus());
    const stepIdx = order.indexOf(step);
    return curIdx > stepIdx;
  }

  isStepCurrent(step: string): boolean {
    return this.currentStatus() === step;
  }
}
