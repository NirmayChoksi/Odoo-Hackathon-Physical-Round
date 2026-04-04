import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-update-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './update-password.html',
  styleUrl: './update-password.css'
})
export class UpdatePassword {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  password = signal('');
  confirmPassword = signal('');
  showPassword = signal(false);
  showConfirm = signal(false);
  
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  passwordTouched = signal(false);
  confirmTouched = signal(false);

  togglePassword() { this.showPassword.update(v => !v); }
  toggleConfirm() { this.showConfirm.update(v => !v); }

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
    return !!this.password() && !!this.confirmPassword() && !this.passwordError && !this.confirmError;
  }

  async onSubmit() {
    this.passwordTouched.set(true);
    this.confirmTouched.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (!this.formValid) return;

    this.isLoading.set(true);
    try {
      // Simulate network request to update password
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      this.successMessage.set('Password successfully updated!');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);

    } catch (e) {
      this.errorMessage.set('Failed to update password');
    } finally {
      this.isLoading.set(false);
    }
  }
}
