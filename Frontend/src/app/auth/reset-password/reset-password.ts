import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css'
})
export class ResetPassword {
  private authService = inject(AuthService);

  email = signal('');
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  async onSubmit() {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (!this.email()) {
      this.errorMessage.set('Please enter your email address');
      return;
    }

    this.isLoading.set(true);
    try {
      const res = await this.authService.resetPassword(this.email());
      if (res.success) {
        this.successMessage.set('The password reset link has been sent to your email.');
        this.email.set('');
      } else {
        this.errorMessage.set(res.error || 'Failed to verify email');
      }
    } catch (e) {
      this.errorMessage.set('An error occurred');
    } finally {
      this.isLoading.set(false);
    }
  }
}
