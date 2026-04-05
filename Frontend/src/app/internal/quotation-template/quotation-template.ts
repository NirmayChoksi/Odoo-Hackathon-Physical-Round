import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SUBSCRIPTION_APP_PATHS } from '../subscription-app.constants';
import { QuotationTemplateApiService } from './quotation-template-api.service';
import { firstValueFrom } from 'rxjs';

export interface QuotationProduct {
  id?: string;
  product_id?: number;
  product: string;
  description: string;
  quantity: number;
  unit_price?: number;
  tax_id?: number;
}

@Component({
  selector: 'app-quotation-template',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quotation-template.html',
  styleUrl: './quotation-template.css'
})
export class QuotationTemplateComponent implements OnInit {
  private readonly api = inject(QuotationTemplateApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  templateId = signal<number | null>(null);
  isLoading = signal(false);

  // Search
  searchQuery = signal<string>('');

  // Form State
  templateName = signal<string>('');
  validityDays = signal<number>(15);
  recurringPlanId = signal<number | null>(null);
  lastForever = signal<boolean>(false);
  endAfterAmount = signal<number>(1);
  endAfterUnit = signal<string>('Month');

  timeUnits = ['Week', 'Month', 'Year'];

  products = signal<QuotationProduct[]>([]);

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.templateId.set(Number(id));
      await this.loadTemplate(this.templateId()!);
    }
  }

  async loadTemplate(id: number) {
    this.isLoading.set(true);
    try {
      const res = await firstValueFrom(this.api.get(id));
      if (res.success) {
        const t = res.data;
        this.templateName.set(t.template_name ?? '');
        this.validityDays.set(t.validity_days ?? 15);
        this.recurringPlanId.set(t.plan_id ?? null);
        this.lastForever.set(t.last_forever ?? false);
        this.endAfterAmount.set(t.end_after_amount ?? 1);
        this.endAfterUnit.set(t.end_after_unit ?? 'Month');

        if (t.items) {
          this.products.set(
            t.items.map((i: any) => ({
              id: i.template_item_id,
              product_id: i.product_id,
              product: i.product_name ?? '',
              description: i.description ?? i.product_name ?? '',
              quantity: i.quantity ?? 1,
              unit_price: i.unit_price ?? 0,
              tax_id: i.tax_id ?? null
            }))
          );
        }
      }
    } catch (err) {
      console.error('Failed to load template', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Search handler — calls list API with search query
  onSearch(query: string) {
    this.searchQuery.set(query);
    this.loadList(query);
  }

  async loadList(search?: string) {
    this.isLoading.set(true);
    try {
      const res = await firstValueFrom(this.api.list(1, 100, search));
      if (res.success) {
        // Handle list result — navigate or populate a list signal as needed
        console.log('Template list loaded', res.data);
      }
    } catch (err) {
      console.error('Failed to load template list', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  onNew() {
    this.templateId.set(null);
    this.templateName.set('');
    this.validityDays.set(15);
    this.recurringPlanId.set(null);
    this.lastForever.set(false);
    this.endAfterAmount.set(1);
    this.endAfterUnit.set('Month');
    this.products.set([]);
    this.searchQuery.set('');
  }

  async onDelete() {
    if (!this.templateId()) return;
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await firstValueFrom(this.api.remove(this.templateId()!));
      alert('Template deleted');
      this.router.navigate([SUBSCRIPTION_APP_PATHS.configuration]);
    } catch (err) {
      console.error('Delete failed', err);
      alert('Delete failed');
    }
  }

  async onSave() {
    if (!this.templateName().trim()) {
      alert('Please enter a template name.');
      return;
    }

    const body = {
      templateName: this.templateName(),
      validityDays: this.validityDays(),
      planId: this.recurringPlanId(),
      lastForever: this.lastForever(),
      endAfterAmount: this.lastForever() ? null : this.endAfterAmount(),
      endAfterUnit: this.lastForever() ? null : this.endAfterUnit(),
      items: this.products().map(p => ({
        productId: p.product_id ?? null,
        quantity: p.quantity,
        unitPrice: p.unit_price ?? 0,
        taxId: p.tax_id ?? null
      }))
    };

    this.isLoading.set(true);
    try {
      if (this.templateId()) {
        await firstValueFrom(this.api.update(this.templateId()!, body));
        alert('Template updated');
      } else {
        const res = await firstValueFrom(this.api.create(body));
        if (res.success) {
          alert('Template created');
          this.templateId.set(res.data.templateId);
        }
      }
    } catch (err) {
      console.error('Save failed', err);
      alert('Save failed');
    } finally {
      this.isLoading.set(false);
    }
  }

  // Add a blank product row
  addProductRow() {
    this.products.set([
      ...this.products(),
      { product: '', description: '', quantity: 1, unit_price: 0 }
    ]);
  }

  // Update a specific field in a product row
  updateProduct(index: number, field: keyof QuotationProduct, value: any) {
    const updated = [...this.products()];
    updated[index] = { ...updated[index], [field]: value };
    this.products.set(updated);
  }

  // Remove a product row by index
  removeProduct(index: number) {
    const updated = this.products().filter((_, i) => i !== index);
    this.products.set(updated);
  }
}