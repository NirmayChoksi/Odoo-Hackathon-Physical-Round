import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SUBSCRIPTION_APP_PATHS } from '../subscription-app.constants';
import { DiscountApiService } from './discount-api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-discount',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './discount.html',
  styleUrl: './discount.css'
})
export class DiscountComponent implements OnInit {
  private readonly api = inject(DiscountApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  discountId = signal<number | null>(null);
  isLoading = signal(false);

  // Form State
  discountName = signal<string>('');
  discountType = signal<'Percentage' | 'Fixed Price'>('Percentage');
  minimumPurchase = signal<number | null>(null);
  minimumQuantity = signal<number | null>(null);
  products = signal<string>('');
  couponCode = signal<string>('');
  
  startDate = signal<string>('');
  endDate = signal<string>('');
  limitUsage = signal<boolean>(false);
  limitUsageCount = signal<number | null>(null);

  discountTypes: Array<'Percentage' | 'Fixed Price'> = ['Fixed Price', 'Percentage'];

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.discountId.set(Number(id));
      await this.loadDiscount(this.discountId()!);
    }
  }

  async loadDiscount(id: number) {
    this.isLoading.set(true);
    try {
      const res = await firstValueFrom(this.api.get(id));
      if (res.success) {
        const d = res.data;
        this.discountName.set(d.discount_name);
        this.discountType.set(d.discount_type === 'PERCENTAGE' ? 'Percentage' : 'Fixed Price');
        this.minimumPurchase.set(Number(d.min_purchase_amount));
        this.minimumQuantity.set(Number(d.min_quantity));
        this.products.set(d.products || '');
        this.couponCode.set(d.coupon_code || '');
        this.startDate.set(d.start_date ? d.start_date.split('T')[0] : '');
        this.endDate.set(d.end_date ? d.end_date.split('T')[0] : '');
        this.limitUsage.set(!!d.usage_limit);
        this.limitUsageCount.set(d.usage_limit || null);
      }
    } catch (err) {
      console.error('Failed to load discount', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  onNew() {
    this.discountId.set(null);
    this.discountName.set('');
    this.discountType.set('Percentage');
    this.minimumPurchase.set(null);
    this.minimumQuantity.set(null);
    this.products.set('');
    this.couponCode.set('');
    this.startDate.set('');
    this.endDate.set('');
    this.limitUsage.set(false);
    this.limitUsageCount.set(null);
  }

  async onDelete() {
    if (!this.discountId()) return;
    if (!confirm('Are you sure you want to delete this discount?')) return;
    
    try {
      await firstValueFrom(this.api.remove(this.discountId()!));
      alert('Discount deleted');
      this.router.navigate([SUBSCRIPTION_APP_PATHS.configuration]);
    } catch (err) {
      alert('Delete failed');
    }
  }

  async onSave() {
    const body = {
      discountName: this.discountName(),
      discountType: this.discountType() === 'Percentage' ? 'PERCENTAGE' : 'FIXED',
      discountValue: 0,
      minPurchaseAmount: this.minimumPurchase() || 0,
      minQuantity: this.minimumQuantity() || 0,
      products: this.products(),
      couponCode: this.couponCode(),
      startDate: this.startDate() || null,
      endDate: this.endDate() || null,
      usageLimit: this.limitUsage() ? this.limitUsageCount() : null,
      status: 'ACTIVE'
    };

    try {
      if (this.discountId()) {
        await firstValueFrom(this.api.update(this.discountId()!, body));
        alert('Discount updated');
      } else {
        const res = await firstValueFrom(this.api.create(body));
        alert('Discount created');
        this.discountId.set(res.data.discountId);
      }
    } catch (err) {
      alert('Save failed');
    }
  }

}
