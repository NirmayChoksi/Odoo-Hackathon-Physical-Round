import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-subscription-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './subscription-form.html',
  styleUrl: './subscription-form.css'
})
export class SubscriptionFormComponent {
  navItems = signal([
    { label: 'Subscriptions', active: true, path: '/subscriptions' },
    { label: 'Products', active: false, path: '/products' },
    { label: 'Reporting', active: false, path: '/reporting' },
    { label: 'Users/Contacts', active: false, path: '/users' },
    {
      label: 'Configuration',
      active: false,
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

  isConfigOpen = signal(false);

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

  paymentTermOptions = signal([
    { value: '15', label: '15 Days' },
    { value: '30', label: '30 Days' }
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
    window.addEventListener('click', () => this.isConfigOpen.set(false));
  }

  toggleConfig(event: Event) {
    event.stopPropagation();
    this.isConfigOpen.set(!this.isConfigOpen());
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
