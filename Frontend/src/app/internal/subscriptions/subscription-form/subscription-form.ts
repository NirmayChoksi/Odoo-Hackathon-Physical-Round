import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog';
import { CustomerTypeaheadComponent } from '../../../shared/customer-typeahead/customer-typeahead';
import { PaymentTermApiService } from '../../payment-term/payment-term-api.service';
import { SUBSCRIPTION_APP_PATHS } from '../../subscription-app.constants';

const SUBS_API = '/api/internal/subscriptions';
const PLAN_API = '/api/internal/recurring-plans';
const TMPL_API = '/api/internal/quotation-templates';

interface SelectOption { value: string; label: string; }

interface OrderLine {
  subscription_item_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  amount: string;
}

@Component({
  selector: 'app-subscription-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ConfirmDialogComponent, CustomerTypeaheadComponent],
  templateUrl: './subscription-form.html',
  styleUrl: './subscription-form.css',
})
export class SubscriptionFormComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly paymentTermApi = inject(PaymentTermApiService);

  readonly paths = SUBSCRIPTION_APP_PATHS;

  // ── Mode ──────────────────────────────────────────────────
  subscriptionId = signal<number | null>(null);
  isEditMode = signal(false);

  // ── Loading / saving states ───────────────────────────────
  isLoading = signal(false);
  isSaving = signal(false);
  isActioning = signal(false);
  saveError = signal<string | null>(null);
  saveSuccess = signal(false);
  actionError = signal<string | null>(null);
  actionSuccess = signal<string | null>(null);

  // ── Confirm dialog ────────────────────────────────────────
  showCloseDialog = signal(false);

  // ── Status stepper ────────────────────────────────────────
  readonly statusFlow = ['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'CLOSED'];
  currentStatus = signal('DRAFT');
  readonly statusLabel: Record<string, string> = {
    DRAFT: 'Draft', QUOTATION: 'Quotation', CONFIRMED: 'Confirmed', ACTIVE: 'Active', CLOSED: 'Closed',
  };

  // ── Subscription number (SO prefix) ───────────────────────
  subscriptionNumber = signal('SO—');

  // ── Form fields ───────────────────────────────────────────
  customerId = signal('');
  selectedCustomerLabel = signal('');
  templateId = signal('');
  recurringPlanId = signal('');
  paymentTermId = signal('');
  startDate = signal(new Date().toISOString().slice(0, 10));
  expiration = signal('');

  // ── Dropdown options ──────────────────────────────────────
  templateOptions = signal<SelectOption[]>([{ value: '', label: 'No template' }]);
  recurringPlanOptions = signal<SelectOption[]>([{ value: '', label: 'Select plan' }]);
  paymentTermOptions = signal<SelectOption[]>([{ value: '', label: 'Select payment term' }]);

  // ── Order lines ───────────────────────────────────────────
  orderLines = signal<OrderLine[]>([]);
  activeTab = signal<'order-lines' | 'other-info'>('order-lines');
  totalAmount = computed(() =>
    this.orderLines().reduce((s, l) => s + parseFloat(l.amount || '0'), 0)
  );

  // ── Lifecycle ─────────────────────────────────────────────
  async ngOnInit() {
    await Promise.all([
      this.loadPlans(),
      this.loadTemplates(),
      this.loadPaymentTerms(),
    ]);

    const idParam = this.route.snapshot.queryParamMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      if (id > 0) {
        this.subscriptionId.set(id);
        this.isEditMode.set(true);
        await this.loadSubscription(id);
      }
    }
  }

  // ── Data loaders ──────────────────────────────────────────
  private async loadPlans() {
    try {
      const res = await firstValueFrom(
        this.http.get<{ success: boolean; data: { plans?: any[]; rows?: any[] } }>(
          `${PLAN_API}?page=1&limit=200`
        )
      );
      const list = res.data.plans ?? res.data.rows ?? [];
      this.recurringPlanOptions.set([
        { value: '', label: 'Select plan' },
        ...list.map((p: any) => ({ value: String(p.plan_id), label: p.plan_name ?? p.name ?? String(p.plan_id) })),
      ]);
    } catch { /* keep empty */ }
  }

  private async loadTemplates() {
    try {
      const res = await firstValueFrom(
        this.http.get<{ success: boolean; data: { templates?: any[]; rows?: any[] } }>(
          `${TMPL_API}?page=1&limit=200`
        )
      );
      const list = res.data.templates ?? res.data.rows ?? [];
      this.templateOptions.set([
        { value: '', label: 'No template' },
        ...list.map((t: any) => ({ value: String(t.template_id), label: t.template_name ?? t.name ?? String(t.template_id) })),
      ]);
    } catch { /* keep empty */ }
  }

  private async loadPaymentTerms() {
    try {
      const res = await firstValueFrom(this.paymentTermApi.list(1, 100, undefined, 'ACTIVE'));
      if (!res.success) return;
      this.paymentTermOptions.set([
        { value: '', label: 'Select payment term' },
        ...res.data.terms.map((t) => ({ value: String(t.paymentTermId), label: t.termName })),
      ]);
    } catch { /* keep empty */ }
  }

  async loadSubscription(id: number) {
    this.isLoading.set(true);
    this.saveError.set(null);
    try {
      const [subRes, itemsRes] = await Promise.all([
        firstValueFrom(this.http.get<{ success: boolean; data: any }>(`${SUBS_API}/${id}`)),
        firstValueFrom(this.http.get<{ success: boolean; data: { items: OrderLine[] } }>(`${SUBS_API}/${id}/items`)),
      ]);
      const s = subRes.data;
      const rawNum = String(s.subscription_number ?? s.subscription_id ?? id);
      this.subscriptionNumber.set(rawNum.startsWith('SO') ? rawNum : `SO${rawNum}`);
      this.currentStatus.set(s.status ?? 'DRAFT');
      this.customerId.set(String(s.customer_id ?? ''));
      this.selectedCustomerLabel.set(s.customer_name ?? '');
      this.recurringPlanId.set(String(s.plan_id ?? ''));
      this.templateId.set(s.template_id ? String(s.template_id) : '');
      this.paymentTermId.set(s.payment_terms ?? '');
      this.expiration.set(s.expiration_date ? s.expiration_date.slice(0, 10) : '');
      this.startDate.set(s.start_date ? s.start_date.slice(0, 10) : '');
      this.orderLines.set(itemsRes.data?.items ?? []);
    } catch (e: any) {
      this.saveError.set(e?.error?.message || e?.message || 'Failed to load subscription');
    } finally {
      this.isLoading.set(false);
    }
  }

  // ── Customer typeahead callbacks ──────────────────────────
  onCustomerSelected(event: { id: string; label: string }) {
    this.customerId.set(event.id);
    this.selectedCustomerLabel.set(event.label);
    this.saveError.set(null);
  }

  onCreateCustomer(name: string) {
    this.saveError.set(`To create customer "${name}", please use the Customers module.`);
  }

  // ── Save ──────────────────────────────────────────────────
  async onSave() {
    if (!this.customerId()) { this.saveError.set('Customer is required.'); return; }
    if (!this.recurringPlanId()) { this.saveError.set('Recurring plan is required.'); return; }
    this.isSaving.set(true);
    this.saveError.set(null);
    this.saveSuccess.set(false);
    try {
      if (this.isEditMode() && this.subscriptionId()) {
        const patchBody: any = {};
        if (this.recurringPlanId()) patchBody.planId = Number(this.recurringPlanId());
        if (this.templateId()) patchBody.templateId = Number(this.templateId());
        if (this.expiration()) patchBody.expirationDate = this.expiration();
        if (this.paymentTermId()) patchBody.paymentTerms = this.paymentTermId();
        await firstValueFrom(this.http.patch(`${SUBS_API}/${this.subscriptionId()}`, patchBody));
        this.saveSuccess.set(true);
        setTimeout(() => this.saveSuccess.set(false), 3000);
      } else {
        const body: any = { customerId: Number(this.customerId()), planId: Number(this.recurringPlanId()) };
        if (this.templateId()) body.templateId = Number(this.templateId());
        if (this.startDate()) body.startDate = this.startDate();
        await firstValueFrom(this.http.post<{ success: boolean; data: any }>(SUBS_API, body));
        this.router.navigate([SUBSCRIPTION_APP_PATHS.subscriptions]);
      }
    } catch (e: any) {
      this.saveError.set(e?.error?.message || e?.error?.errors?.[0]?.message || e?.message || 'Save failed');
    } finally {
      this.isSaving.set(false);
    }
  }

  // ── Status actions ────────────────────────────────────────
  async onSend()     { await this.patchStatus('QUOTATION'); }
  async onConfirm()  { await this.patchStatus('CONFIRMED'); }
  async onActivate() { await this.patchStatus('ACTIVE'); }

  private async patchStatus(status: string) {
    if (!this.subscriptionId()) return;
    this.isActioning.set(true);
    this.actionError.set(null);
    try {
      await firstValueFrom(this.http.patch(`${SUBS_API}/${this.subscriptionId()}/status`, { status }));
      this.currentStatus.set(status);
      this.actionSuccess.set(`Status updated to ${this.statusLabel[status]}`);
      setTimeout(() => this.actionSuccess.set(null), 3000);
    } catch (e: any) {
      this.actionError.set(e?.error?.message || e?.message || 'Status update failed');
    } finally {
      this.isActioning.set(false);
    }
  }

  onClose() {
    if (!this.subscriptionId()) return;
    this.showCloseDialog.set(true);
  }

  async performClose() {
    this.isActioning.set(true);
    this.actionError.set(null);
    try {
      await firstValueFrom(this.http.post(`${SUBS_API}/${this.subscriptionId()}/close`, {}));
      this.showCloseDialog.set(false);
      this.currentStatus.set('CLOSED');
      this.actionSuccess.set('Subscription closed.');
      setTimeout(() => this.actionSuccess.set(null), 3000);
    } catch (e: any) {
      this.showCloseDialog.set(false);
      this.actionError.set(e?.error?.message || e?.message || 'Close failed');
    } finally {
      this.isActioning.set(false);
    }
  }

  async onRenew() {
    if (!this.subscriptionId()) return;
    this.isActioning.set(true);
    this.actionError.set(null);
    try {
      const res = await firstValueFrom(
        this.http.post<{ success: boolean; data: { subscriptionId: number; subscriptionNumber: string } }>(
          `${SUBS_API}/${this.subscriptionId()}/renew`, {}
        )
      );
      this.actionSuccess.set(`Renewed as ${res.data.subscriptionNumber}`);
      setTimeout(() => this.actionSuccess.set(null), 4000);
    } catch (e: any) {
      this.actionError.set(e?.error?.message || e?.message || 'Renew failed');
    } finally {
      this.isActioning.set(false);
    }
  }

  async onGenerateInvoice() {
    if (!this.subscriptionId()) return;
    this.isActioning.set(true);
    this.actionError.set(null);
    try {
      const res = await firstValueFrom(
        this.http.post<{ success: boolean; data: { invoiceId: number; invoiceNumber: string } }>(
          `${SUBS_API}/${this.subscriptionId()}/invoice`, {}
        )
      );
      this.actionSuccess.set(`Invoice ${res.data.invoiceNumber} generated`);
      setTimeout(() => this.actionSuccess.set(null), 4000);
    } catch (e: any) {
      this.actionError.set(e?.error?.message || e?.message || 'Invoice generation failed');
    } finally {
      this.isActioning.set(false);
    }
  }

  // ── Stepper helpers ───────────────────────────────────────
  isStepComplete(step: string): boolean {
    return this.statusFlow.indexOf(this.currentStatus()) > this.statusFlow.indexOf(step);
  }
  isStepCurrent(step: string): boolean {
    return this.currentStatus() === step;
  }

  get isClosed(): boolean { return this.currentStatus() === 'CLOSED'; }
  get isActive(): boolean  { return this.currentStatus() === 'ACTIVE'; }

  onTabClick(tabId: 'order-lines' | 'other-info') {
    this.activeTab.set(tabId);
  }
}
