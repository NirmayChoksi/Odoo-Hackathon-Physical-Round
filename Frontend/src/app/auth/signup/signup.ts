import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../auth.store';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class Signup {
  private authStore = inject(AuthStore);
  private router = inject(Router);

  name = signal('');
  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  showPassword = signal(false);
  showConfirm = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Validation signals
  nameTouched = signal(false);
  emailTouched = signal(false);
  passwordTouched = signal(false);
  confirmTouched = signal(false);

  togglePassword() { this.showPassword.update(v => !v); }
  toggleConfirm() { this.showConfirm.update(v => !v); }

  get nameError(): string | null {
    if (!this.nameTouched()) return null;
    if (!this.name()) return 'Name is required';
    return null;
  }

  get emailError(): string | null {
    if (!this.emailTouched()) return null;
    if (!this.email()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email())) return 'Enter a valid email';
    return null;
  }

  get passwordError(): string | null {
    if (!this.passwordTouched()) return null;
    const p = this.password();
    if (!p) return 'Password is required';
    if (p.length < 8) return 'Minimum 8 characters';
    if (!/[A-Z]/.test(p)) return 'Needs at least 1 uppercase letter';
    if (!/[a-z]/.test(p)) return 'Needs at least 1 lowercase letter';
    if (!/\W/.test(p)) return 'Needs at least 1 special character';
    return null;
  }

  get confirmError(): string | null {
    if (!this.confirmTouched()) return null;
    if (!this.confirmPassword()) return 'Please confirm your password';
    if (this.password() !== this.confirmPassword()) return 'Passwords do not match';
    return null;
  }

  get formValid(): boolean {
    return !!this.name() && !!this.email() && !!this.password() && !!this.confirmPassword()
      && !this.nameError && !this.emailError && !this.passwordError && !this.confirmError;
  }

  async onSubmit() {
    this.nameTouched.set(true);
    this.emailTouched.set(true);
    this.passwordTouched.set(true);
    this.confirmTouched.set(true);
    this.errorMessage.set(null);

    if (!this.formValid) return;

    this.isLoading.set(true);
    try {
      const res = await this.authStore.signup(this.name(), this.email(), this.password());
      if (res.success) {
        this.router.navigate(['/login']);
      } else {
        this.errorMessage.set(res.error || 'Signup failed');
      }
    } catch (e) {
      this.errorMessage.set('An error occurred');
    } finally {
      this.isLoading.set(false);
    }
  }

  onGoogleSignup() {
    alert('Google OAuth flow initiated (mock)');
  }
}
