import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SUBSCRIPTION_APP_PATHS } from '../../subscription-app.constants';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css',
})
export class UserFormComponent implements OnInit {
  userId = signal<number | null>(null);
  isLoading = signal(false);
  
  // Form signals
  name = signal('');
  email = signal('');
  phone = signal('');
  roleId = signal(2); // Default to Internal User
  status = signal<'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>('ACTIVE');
  isChangingPassword = signal(false);
  password = signal('');

  paths = SUBSCRIPTION_APP_PATHS;

  constructor(
    private router: Router, 
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  async ngOnInit() {
    this.route.params.subscribe(async params => {
      const id = params['id'];
      if (id && id !== 'new') {
        this.userId.set(Number(id));
        await this.loadUser(Number(id));
      } else {
        this.userId.set(null);
        this.isChangingPassword.set(true); // Always show for new user
      }
    });
  }

  async loadUser(id: number) {
    this.isLoading.set(true);
    try {
      const res = await firstValueFrom(this.http.get<{ success: boolean; data: any }>(`/api/internal/users/${id}`));
      if (res.success) {
        const u = res.data;
        this.name.set(u.full_name);
        this.email.set(u.email);
        this.phone.set(u.phone || '');
        this.roleId.set(u.role_id);
        this.status.set(u.status);
      }
    } catch (e) {
      alert('Failed to load user');
      this.router.navigate([this.paths.users]);
    } finally {
      this.isLoading.set(false);
    }
  }

  onNew() {
    this.userId.set(null);
    this.name.set('');
    this.email.set('');
    this.phone.set('');
    this.roleId.set(2);
    this.status.set('ACTIVE');
    this.password.set('');
    this.isChangingPassword.set(true);
    this.router.navigate([this.paths.users, 'new']);
  }

  async onSave() {
    if (!this.name() || !this.email()) {
      alert('Please fill in at least Name and Email.');
      return;
    }

    if (!this.userId() && !this.password()) {
      alert('Password is required for new users.');
      return;
    }

    const payload: any = {
      fullName: this.name(),
      email: this.email(),
      phone: this.phone(),
      roleId: this.roleId(),
      status: this.status()
    };

    if (this.password()) {
      payload.password = this.password();
    }

    try {
      if (this.userId()) {
        await firstValueFrom(this.http.patch(`/api/internal/users/${this.userId()}`, payload));
        alert('User updated successfully!');
      } else {
        const res = await firstValueFrom(this.http.post<{ success: boolean; data: any }>('/api/internal/users', payload));
        alert('User created successfully!');
        this.router.navigate([this.paths.users, res.data.user_id]);
      }
      // Reset password state on success
      this.password.set('');
      this.isChangingPassword.set(this.userId() === null);
    } catch (e: any) {
      alert(e.error?.message || 'Failed to save user');
    }
  }

  async onDelete() {
    if (!this.userId()) {
      alert('No user to delete.');
      return;
    }
    if (confirm(`Delete user "${this.name()}"?`)) {
      try {
        await firstValueFrom(this.http.delete(`/api/internal/users/${this.userId()}`));
        alert('User deleted.');
        this.router.navigate([this.paths.users]);
      } catch (e: any) {
        alert(e.error?.message || 'Failed to delete user');
      }
    }
  }

  onChangePassword() {
    this.isChangingPassword.set(!this.isChangingPassword());
  }
}
