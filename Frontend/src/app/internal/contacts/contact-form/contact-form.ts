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
  styleUrl: './contact-form.css',
})
export class ContactFormComponent {
  // Form signals
  name = signal('');
  email = signal('');
  phone = signal('');
  address1 = signal('');
  address2 = signal('');
  address3 = signal('');

  // No of active subscriptions for this contact
  subscriptionCount = signal(2);

  constructor(private router: Router) {}

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
