import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { email, form, required } from '@angular/forms/signals';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProfileStore } from '../../profile/profile.store';
import { INTERNAL_DASHBOARD_NAV_BASE } from '../ecommerce-navigation';
import { NavbarComponent } from '../shared/navbar/navbar';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    RouterModule
  ],
  templateUrl: './account.html',
  styleUrl: './account.css',
})
export class AccountComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly profileStore = inject(ProfileStore);

  readonly navLinkBase = this.route.snapshot.data['navLinkBase'] as string | undefined;

  /** Account page opened from internal dashboard shell — slimmer UI than storefront. */
  get isInternalAccount(): boolean {
    return this.navLinkBase === INTERNAL_DASHBOARD_NAV_BASE;
  }

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

  readonly isAddingAddress = signal(false);

  readonly addressModel = signal({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    isDefault: false,
  });

  readonly addressForm = form(this.addressModel, (m) => {
    required(m.fullName);
    required(m.phone);
    required(m.addressLine1);
    required(m.city);
    required(m.state);
    required(m.postalCode);
    required(m.country);
  });

  readonly addrFullNameState = computed(() => this.addressForm.fullName());
  readonly addrPhoneState = computed(() => this.addressForm.phone());
  readonly addrLine1State = computed(() => this.addressForm.addressLine1());
  readonly addrCityState = computed(() => this.addressForm.city());
  readonly addrStateState = computed(() => this.addressForm.state());
  readonly addrPostalCodeState = computed(() => this.addressForm.postalCode());
  readonly addrCountryState = computed(() => this.addressForm.country());

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

  updateAddressField(field: keyof ReturnType<typeof this.addressModel>, value: any) {
    this.addressModel.update((m) => ({ ...m, [field]: value }));
  }

  toggleAddAddress() {
    if (!this.isAddingAddress()) {
      const p = this.profileStore.profile();
      this.addressModel.set({
        fullName: p?.full_name ?? '',
        phone: p?.phone ?? '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        isDefault: this.profileStore.addresses().length === 0,
      });
      this.profileStore.clearSaveError();
    }
    this.isAddingAddress.update((v) => !v);
  }

  async saveAddress() {
    if (!this.addressForm().valid()) return;
    const res = await this.profileStore.addAddress(this.profileApiUrl(), this.addressModel());
    if (res.success) {
      this.isAddingAddress.set(false);
    }
  }
}
