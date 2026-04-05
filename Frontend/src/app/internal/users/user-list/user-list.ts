import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SUBSCRIPTION_APP_PATHS } from '../../subscription-app.constants';

interface UserRow {
  user_id: number;
  full_name: string;
  email: string;
  role_id: number;
  role_name: string;
  phone: string | null;
  status: string;
  created_at: string;
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css'
})
export class UserListComponent implements OnInit {
  users = signal<UserRow[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  searchTerm = signal('');
  selectedStatus = signal('');

  paths = SUBSCRIPTION_APP_PATHS;

  filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const status = this.selectedStatus();
    
    return this.users().filter(u => {
      const matchSearch = u.full_name.toLowerCase().includes(term) || 
                          u.email.toLowerCase().includes(term);
      const matchStatus = status === '' || u.status === status;
      return matchSearch && matchStatus;
    });
  });

  constructor(private http: HttpClient, private router: Router) {}

  async ngOnInit() {
    await this.loadUsers();
  }

  async loadUsers() {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(this.http.get<{ success: boolean; data: UserRow[] }>('/api/internal/users'));
      if (res.success) {
        this.users.set(res.data);
      }
    } catch (e: any) {
      this.error.set(e.error?.message || 'Failed to load users');
    } finally {
      this.isLoading.set(false);
    }
  }

  goToUser(id: number) {
    this.router.navigate(['/subscription/users', id]);
  }

  onCreate() {
    this.router.navigate(['/subscription/users/new']);
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  onStatusFilter(status: string) {
    this.selectedStatus.set(status);
  }
}
