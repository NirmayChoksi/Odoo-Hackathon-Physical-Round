import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SUBSCRIPTION_APP_PATHS } from '../../subscription-app.constants';

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './contact-form.html',
  styleUrl: './contact-form.css',
})
export class ContactFormComponent implements OnInit {
  contactId = signal<number | null>(null);
  isLoading = signal(false);
  customers = signal<{ customer_id: number; customer_name: string }[]>([]);
  
  // Form signals
  customerId = signal<number | null>(null);
  name = signal('');
  email = signal('');
  phone = signal('');
  designation = signal('');

  paths = SUBSCRIPTION_APP_PATHS;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  async ngOnInit() {
    await this.loadCustomers();
    this.route.params.subscribe(async params => {
      const id = params['id'];
      if (id && id !== 'new') {
        this.contactId.set(Number(id));
        await this.loadContact(Number(id));
      }
    });
  }

  async loadCustomers() {
    try {
      const res = await firstValueFrom(this.http.get<{ success: boolean; data: any[] }>('/api/internal/customers'));
      if (res.success) {
        this.customers.set(res.data);
      }
    } catch (e) {
      console.error('Failed to load customers');
    }
  }

  async loadContact(id: number) {
    this.isLoading.set(true);
    try {
      const res = await firstValueFrom(this.http.get<{ success: boolean; data: any }>(`/api/internal/contacts/${id}`));
      if (res.success) {
        const c = res.data;
        this.name.set(c.contact_name);
        this.email.set(c.email || '');
        this.phone.set(c.phone || '');
        this.designation.set(c.designation || '');
        this.customerId.set(c.customer_id);
      }
    } catch (e) {
      alert('Failed to load contact');
      this.router.navigate([this.paths.contacts]);
    } finally {
      this.isLoading.set(false);
    }
  }

  onNew() {
    this.router.navigate([this.paths.contacts, 'new']);
    this.contactId.set(null);
    this.customerId.set(null);
    this.name.set('');
    this.email.set('');
    this.phone.set('');
    this.designation.set('');
  }

  async onSave() {
    if (!this.name() || !this.customerId()) {
      alert('Please fill in Name and select a Customer.');
      return;
    }

    const payload = {
      customerId: this.customerId(),
      contactName: this.name(),
      email: this.email(),
      phone: this.phone(),
      designation: this.designation()
    };

    try {
      if (this.contactId()) {
        await firstValueFrom(this.http.patch(`/api/internal/contacts/${this.contactId()}`, payload));
        alert('Contact updated successfully!');
      } else {
        const res = await firstValueFrom(this.http.post<{ success: boolean; data: any }>('/api/internal/contacts', payload));
        alert('Contact created successfully!');
        this.router.navigate([this.paths.contacts, res.data.contact_id]);
      }
    } catch (e: any) {
      alert(e.error?.message || 'Failed to save contact');
    }
  }

  async onDelete() {
    if (!this.contactId()) {
      alert('No contact to delete.');
      return;
    }
    if (confirm(`Delete contact "${this.name()}"?`)) {
      try {
        await firstValueFrom(this.http.delete(`/api/internal/contacts/${this.contactId()}`));
        alert('Contact deleted.');
        this.router.navigate([this.paths.contacts]);
      } catch (e: any) {
        alert(e.error?.message || 'Failed to delete contact');
      }
    }
  }
}
