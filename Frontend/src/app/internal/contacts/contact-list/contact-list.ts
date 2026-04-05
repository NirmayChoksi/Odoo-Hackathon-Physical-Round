import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SUBSCRIPTION_APP_PATHS } from '../../subscription-app.constants';

interface ContactRow {
  contact_id: number;
  customer_id: number;
  customer_name: string;
  contact_name: string;
  email: string | null;
  phone: string | null;
  designation: string | null;
  created_at: string;
}

@Component({
  selector: 'app-contact-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './contact-list.html',
  styleUrl: './contact-list.css'
})
export class ContactListComponent implements OnInit {
  contacts = signal<ContactRow[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  searchTerm = signal('');

  paths = SUBSCRIPTION_APP_PATHS;

  filteredContacts = computed(() => {
    const term = this.searchTerm().toLowerCase();
    
    return this.contacts().filter(c => {
      return c.contact_name.toLowerCase().includes(term) || 
             (c.email?.toLowerCase().includes(term) ?? false) ||
             c.customer_name.toLowerCase().includes(term);
    });
  });

  constructor(private http: HttpClient, private router: Router) {}

  async ngOnInit() {
    await this.loadContacts();
  }

  async loadContacts() {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(this.http.get<{ success: boolean; data: ContactRow[] }>('/api/internal/contacts'));
      if (res.success) {
        this.contacts.set(res.data);
      }
    } catch (e: any) {
      this.error.set(e.error?.message || 'Failed to load contacts');
    } finally {
      this.isLoading.set(false);
    }
  }

  goToContact(id: number) {
    this.router.navigate(['/subscription/contacts', id]);
  }

  onCreate() {
    this.router.navigate(['/subscription/contacts/new']);
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }
}
