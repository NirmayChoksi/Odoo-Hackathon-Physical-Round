import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { SUBSCRIPTION_APP_PATHS } from '../../subscription-app.constants';

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './contact-form.html',
  styleUrl: './contact-form.css'
})
export class ContactFormComponent {
  navItems = signal([
    { label: 'Subscriptions', active: false, path: SUBSCRIPTION_APP_PATHS.subscriptions },
    { label: 'Products', active: false, path: SUBSCRIPTION_APP_PATHS.products },
    { label: 'Reporting', active: false, path: SUBSCRIPTION_APP_PATHS.reporting },
    {
      label: 'Users/Contacts',
      active: true,
      path: SUBSCRIPTION_APP_PATHS.users,
      isDropdown: true,
      dropdownItems: [
        { label: 'Users', path: SUBSCRIPTION_APP_PATHS.users },
        { label: 'Contacts', path: SUBSCRIPTION_APP_PATHS.contacts }
      ]
    },
    {
      label: 'Configuration',
      active: false,
      isDropdown: true,
      dropdownItems: [
        { label: 'Overview', path: SUBSCRIPTION_APP_PATHS.configuration },
        { label: 'Attribute', path: SUBSCRIPTION_APP_PATHS.attribute },
        { label: 'Recurring Plan', path: SUBSCRIPTION_APP_PATHS.recurringPlan },
        { label: 'Quotation Template', path: SUBSCRIPTION_APP_PATHS.quotationTemplate },
        { label: 'Payment term', path: SUBSCRIPTION_APP_PATHS.paymentTerm },
        { label: 'Discount', path: SUBSCRIPTION_APP_PATHS.discount },
        { label: 'Taxes', path: SUBSCRIPTION_APP_PATHS.taxes },
      ]
    }
  ]);

  isDropdownOpen = signal(false);

  // Form signals
  name = signal('');
  email = signal('');
  phone = signal('');
  address1 = signal('');
  address2 = signal('');
  address3 = signal('');

  // No of active subscriptions for this contact
  subscriptionCount = signal(2);

  constructor(private router: Router) {
    window.addEventListener('click', () => this.isDropdownOpen.set(false));
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isDropdownOpen.set(!this.isDropdownOpen());
  }

  onNavClick(item: { label: string }) {
    const items = this.navItems().map(i => ({ ...i, active: i.label === item.label }));
    this.navItems.set(items);
  }

  onNew() {
    this.name.set('');
    this.email.set('');
    this.phone.set('');
    this.address1.set('');
    this.address2.set('');
    this.address3.set('');
  }

  onSave() {
    if (!this.name()) {
      alert('Please fill in at least a Name.');
      return;
    }
    alert('Contact saved successfully!');
  }

  onDelete() {
    if (!this.name()) {
      alert('No contact to delete.');
      return;
    }
    if (confirm(`Delete contact "${this.name()}"?`)) {
      this.onNew();
    }
  }

  onViewSubscriptions() {
    void this.router.navigate([SUBSCRIPTION_APP_PATHS.subscriptions]);
  }
}
