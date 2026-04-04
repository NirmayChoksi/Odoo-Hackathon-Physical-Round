import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  authService = inject(AuthService);
  router = inject(Router);

  email = signal('');
  password = signal('');
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  async onSubmit() {
    this.errorMessage.set(null);
    if (!this.email() || !this.password()) {
      this.errorMessage.set('Please fill in both fields');
      return;
    }

    this.isLoading.set(true);
    try {
      const res = await this.authService.login(this.email(), this.password());
      if (res.success) {
        this.router.navigate(['/dashboard']);
      } else {
        this.errorMessage.set(res.error || 'Failed to login');
      }
    } catch (e) {
      this.errorMessage.set('An error occurred');
    } finally {
      this.isLoading.set(false);
    }
  }
}
