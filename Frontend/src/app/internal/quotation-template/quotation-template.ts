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
        this.templateName.set(t.template_name);
        this.validityDays.set(t.validity_days);
        this.recurringPlanId.set(t.plan_id);
        // Mapping products/items
        if (t.items) {
          this.products.set(t.items.map((i: any) => ({
            id: i.template_item_id,
            product_id: i.product_id,
            product: i.product_name,
            description: i.product_name, // fallback
            quantity: i.quantity,
            unit_price: i.unit_price,
            tax_id: i.tax_id
          })));
        }
      }
    } catch (err) {
      console.error('Failed to load template', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  onNew() {
    this.templateId.set(null);
    this.templateName.set('');
    this.validityDays.set(15);
    this.recurringPlanId.set(null);
    this.products.set([]);
  }

  async onDelete() {
    if (!this.templateId()) return;
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await firstValueFrom(this.api.remove(this.templateId()!));
      alert('Template deleted');
      this.router.navigate([SUBSCRIPTION_APP_PATHS.configuration]);
    } catch (err) {
      alert('Delete failed');
    }
  }

  async onSave() {
    const body = {
      templateName: this.templateName(),
      validityDays: this.validityDays(),
      planId: this.recurringPlanId(),
      items: this.products().map(p => ({
        productId: p.product_id,
        quantity: p.quantity,
        unitPrice: p.unit_price || 0,
        taxId: p.tax_id
      }))
    };

    try {
      if (this.templateId()) {
        await firstValueFrom(this.api.update(this.templateId()!, body));
        alert('Template updated');
      } else {
        const res = await firstValueFrom(this.api.create(body));
        alert('Template created');
        this.templateId.set(res.data.templateId);
      }
    } catch (err) {
      alert('Save failed');
    }
  }

  addProductRow() {
    this.products.set([...this.products(), { product: '', description: '', quantity: 1 }]);
  }
}
