import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog';
import {
  CONFIGURATION_DROPDOWN_ITEMS,
  SUBSCRIPTION_APP_PATHS,
  USERS_CONTACTS_DROPDOWN_ITEMS,
} from '../../subscription-app.constants';

const API = '/api/internal/products';

interface ProductDetail {
  product_id: number;
  product_name: string;
  product_type: string;
  sales_price: string;
  cost_price: string;
  description: string | null;
  image_urls: string | null;
  short_description: string | null;
  terms_and_conditions: string | null;
  is_recurring: number;
  status: string;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule, ConfirmDialogComponent],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class ProductsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);

  readonly paths = SUBSCRIPTION_APP_PATHS;

  // Route mode — edit when ?id= is provided
  productId = signal<number | null>(null);
  isEditMode = signal(false);

  // UI state
  isSaving = signal(false);
  isDeleting = signal(false);
  isLoading = signal(false);
  saveError = signal<string | null>(null);
  saveSuccess = signal(false);
  showDeleteDialog = signal(false);

  // Navigation
  navItems = signal([
    { label: 'Subscriptions', active: false, path: SUBSCRIPTION_APP_PATHS.subscriptions },
    { label: 'Products', active: true, path: SUBSCRIPTION_APP_PATHS.products },
    { label: 'Reporting', active: false, path: SUBSCRIPTION_APP_PATHS.reporting },
    {
      label: 'Users/Contacts',
      active: false,
      path: SUBSCRIPTION_APP_PATHS.users,
      isDropdown: true,
      dropdownItems: [...USERS_CONTACTS_DROPDOWN_ITEMS],
    },
    {
      label: 'Configuration',
      active: false,
      isDropdown: true,
      dropdownItems: [...CONFIGURATION_DROPDOWN_ITEMS],
    },
  ]);
  navDropdownOpenKey = signal<string | null>(null);

  // Form fields
  productName = signal('');
  productType = signal('Service');
  salesPrice = signal<number | null>(0);
  costPrice = signal<number | null>(0);
  description = signal('');
  imageUrls = signal('');
  shortDescription = signal('');
  termsAndConditions = signal('');
  isRecurring = signal(true);
  status = signal('ACTIVE');

  readonly types = ['Service', 'Software', 'Cloud Service', 'Consumable', 'Storable Product'];

  async ngOnInit() {
    const idParam = this.route.snapshot.queryParamMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      if (id > 0) {
        this.productId.set(id);
        this.isEditMode.set(true);
        await this.loadProduct(id);
      }
    }
  }

  async loadProduct(id: number) {
    this.isLoading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.get<{ success: boolean; data: ProductDetail }>(`${API}/${id}`)
      );
      const p = res.data;
      this.productName.set(p.product_name);
      this.productType.set(p.product_type);
      this.salesPrice.set(parseFloat(p.sales_price));
      this.costPrice.set(parseFloat(p.cost_price));
      this.description.set(p.description ?? '');
      this.imageUrls.set(p.image_urls ?? '');
      this.shortDescription.set(p.short_description ?? '');
      this.termsAndConditions.set(p.terms_and_conditions ?? '');
      this.isRecurring.set(!!p.is_recurring);
      this.status.set(p.status);
    } catch (e: any) {
      this.saveError.set(e?.error?.message || e?.message || 'Failed to load product');
    } finally {
      this.isLoading.set(false);
    }
  }

  buildBody() {
    return {
      productName: this.productName().trim(),
      productType: this.productType(),
      salesPrice: this.salesPrice() ?? 0,
      costPrice: this.costPrice() ?? 0,
      description: this.description().trim() || undefined,
      imageUrls: this.imageUrls().trim() || undefined,
      shortDescription: this.shortDescription().trim() || undefined,
      termsAndConditions: this.termsAndConditions().trim() || undefined,
      isRecurring: this.isRecurring(),
      status: this.status(),
    };
  }

  async onSave() {
    if (!this.productName().trim()) {
      this.saveError.set('Product name is required.');
      return;
    }
    this.isSaving.set(true);
    this.saveError.set(null);
    this.saveSuccess.set(false);
    try {
      const body = this.buildBody();
      if (this.isEditMode() && this.productId()) {
        await firstValueFrom(this.http.patch(`${API}/${this.productId()}`, body));
        this.saveSuccess.set(true);
        setTimeout(() => this.saveSuccess.set(false), 3000);
      } else {
        // Create → navigate to list so new product is visible immediately
        await firstValueFrom(
          this.http.post<{ success: boolean; data: { product_id: number } }>(API, body)
        );
        this.router.navigate([this.paths.products]);
      }
    } catch (e: any) {
      this.saveError.set(e?.error?.message || e?.error?.errors?.[0]?.message || e?.message || 'Save failed');
    } finally {
      this.isSaving.set(false);
    }
  }

  /** Open the confirm dialog — actual delete happens in performDelete() */
  onDelete() {
    if (!this.isEditMode() || !this.productId()) return;
    this.showDeleteDialog.set(true);
  }

  /** Called when user clicks the confirm button inside the dialog */
  async performDelete() {
    this.isDeleting.set(true);
    this.saveError.set(null);
    try {
      await firstValueFrom(this.http.delete(`${API}/${this.productId()}`));
      this.showDeleteDialog.set(false);
      this.router.navigate([this.paths.products]);
    } catch (e: any) {
      this.showDeleteDialog.set(false);
      this.saveError.set(e?.error?.message || e?.message || 'Delete failed');
    } finally {
      this.isDeleting.set(false);
    }
  }

  /** Message shown in the delete confirm dialog */
  get deleteMessage() {
    const name = this.productName().trim();
    return name
      ? `Are you sure you want to delete "${name}"? This action cannot be undone.`
      : 'Are you sure you want to delete this product? This action cannot be undone.';
  }

  toggleNavDropdown(event: Event, label: string) {
    event.stopPropagation();
    this.navDropdownOpenKey.update(k => (k === label ? null : label));
  }

  onNavClick(item: any) {
    this.navItems.set(this.navItems().map(i => ({ ...i, active: i.label === item.label })));
  }

  constructor() {
    window.addEventListener('click', () => this.navDropdownOpenKey.set(null));
  }
}
