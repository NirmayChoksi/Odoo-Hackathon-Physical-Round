import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InputComponent } from '../../../components/input/input';
import { SelectComponent } from '../../../components/select/select';

@Component({
  selector: 'app-subscription-form',
  standalone: true,
  imports: [CommonModule, RouterLink, InputComponent, SelectComponent],
  templateUrl: './subscription-form.html',
  styleUrl: './subscription-form.css'
})
export class SubscriptionFormComponent {
  navItems = signal([
    { label: 'Subscriptions', active: true },
    { label: 'Products', active: false },
    { label: 'Reporting', active: false },
    { label: 'Users/Contacts', active: false },
    { label: 'Configuration', active: false },
    { label: 'My Profile', active: false }
  ]);

  statusFlow = signal(['Quotation', 'Quotation Sent', 'Confirmed']);
  currentStatus = signal('Quotation');

  activeTab = signal('order-lines');

  // Form Fields
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

  orderLines = signal([
    { product: 'demo', quantity: 1, unitPrice: 100, discount: 0, taxes: 0, amount: 100 }
  ]);

  onTabClick(tabId: string) {
    this.activeTab.set(tabId);
  }

  onSave() {
    alert('Subscription Saved');
  }

  onSend() {
    this.currentStatus.set('Quotation Sent');
  }

  onConfirm() {
    this.currentStatus.set('Confirmed');
  }
}
