import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { email, form, required } from '@angular/forms/signals';
import { InputComponent } from '../../components/input/input';
import { RouterModule } from '@angular/router';
import { ProfileStore } from '../../profile/profile.store';
import { ButtonComponent } from '../../components/button/button';
import { NavbarComponent } from '../shared/navbar/navbar';
import { INTERNAL_DASHBOARD_NAV_BASE } from '../ecommerce-navigation';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    ButtonComponent,
    RouterModule,
    InputComponent,
  ],
  templateUrl: './account.html',
  styleUrl: './account.css',
})
export class AccountComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly profileStore = inject(ProfileStore);

  readonly navLinkBase = this.route.snapshot.data['navLinkBase'] as string | undefined;

  readonly isEditing = signal(false);

  readonly editModel = signal({ fullName: '', email: '', phone: '' });
  readonly profileForm = form(this.editModel, (m) => {
    required(m.fullName);
    required(m.email);
    email(m.email);
  });

  readonly fullNameState = computed(() => this.profileForm.fullName());
  readonly emailState = computed(() => this.profileForm.email());
  readonly phoneState = computed(() => this.profileForm.phone());

  async ngOnInit() {
    await this.reloadProfile();
  }

  profileApiUrl(): string {
    return this.navLinkBase === INTERNAL_DASHBOARD_NAV_BASE
      ? '/api/internal/profile'
      : '/api/external/profile';
  }

  async reloadProfile() {
    await this.profileStore.loadProfile(this.profileApiUrl());
  }

  fieldErrorMessage(errors: { message?: string }[]): string | null {
    const first = errors[0];
    return first?.message ?? null;
  }

  updateField(field: keyof ReturnType<typeof this.editModel>, value: string) {
    this.editModel.update((m) => ({ ...m, [field]: value }));
  }

  toggleEdit() {
    if (!this.isEditing()) {
      const p = this.profileStore.profile();
      if (p) {
        this.editModel.set({
          fullName: p.full_name,
          email: p.email,
          phone: p.phone ?? '',
        });
      }
      this.profileStore.clearSaveError();
    }
    this.isEditing.update((v) => !v);
  }

  async save() {
    if (!this.profileForm().valid()) return;
    const { fullName, email: em, phone } = this.editModel();
    const res = await this.profileStore.updateProfile(this.profileApiUrl(), {
      fullName,
      email: em,
      phone,
    });
    if (res.success) {
      this.isEditing.set(false);
    }
  }
}
