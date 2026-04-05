import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom, from, distinctUntilChanged, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog';
import { CustomerTypeaheadComponent } from '../../../shared/customer-typeahead/customer-typeahead';
import { SUBSCRIPTION_APP_PATHS } from '../../subscription-app.constants';
import { PaymentTermStore } from '../../payment-term/payment-term.store';

const SUBS_API = '/api/internal/subscriptions';
const PLAN_API = '/api/internal/recurring-plans';
const TMPL_API = '/api/internal/quotation-templates';
const PRODUCTS_API = '/api/internal/products';
const CUSTOMERS_API = '/api/internal/customers';

interface SelectOption { value: string; label: string; }

interface OrderLine {
  subscription_item_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  amount: string;
}

interface ProductPick {
  product_id: number;
  product_name: string;
  sales_price: string;
}

/** Line items queued before the subscription exists (create flow). */
interface DraftLine {
  key: string;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
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
  private readonly paymentTermStore = inject(PaymentTermStore);
  private readonly destroyRef = inject(DestroyRef);
  /** Bumps when leaving edit or starting a new load — ignores stale HTTP responses. */
  private subscriptionLoadSeq = 0;

  readonly paths = SUBSCRIPTION_APP_PATHS;

  // ── Mode ──────────────────────────────────────────────────
  subscriptionId = signal<number | null>(null);
  isEditMode = signal(false);

  // ── Loading / saving states ───────────────────────────────
  isLoading = signal(false);
  isSaving = signal(false);
  isActioning = signal(false);
  /** Quick-create customer from typeahead (POST customers API). */
  isCreatingCustomer = signal(false);
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
  draftLines = signal<DraftLine[]>([]);
  productCatalog = signal<ProductPick[]>([]);
  draftProductId = signal('');
  draftQuantity = signal(1);
  draftUnitPrice = signal('');
  activeTab = signal<'order-lines' | 'other-info'>('order-lines');
  totalAmount = computed(() =>
    this.orderLines().reduce((s, l) => s + parseFloat(l.amount || '0'), 0)
  );
  draftTotalAmount = computed(() =>
    this.draftLines().reduce((s, l) => s + l.quantity * l.unit_price, 0)
  );

  // ── Lifecycle ─────────────────────────────────────────────
  ngOnInit(): void {
    void this.bootstrapForm();
  }

  /**
   * Same route (`subscriptions/new`) is used for create and edit (`?id=`). Angular reuses the
   * component when only query params change, so we must react to `queryParamMap`, not only `ngOnInit`.
   */
  private async bootstrapForm(): Promise<void> {
    await Promise.all([
      this.loadPlans(),
      this.loadTemplates(),
      this.loadPaymentTerms(),
      this.loadProductCatalog(),
    ]);

    this.route.queryParamMap
      .pipe(
        distinctUntilChanged(
          (a, b) =>
            (a.get('id') ?? '') === (b.get('id') ?? '') && (a.get('plan') ?? '') === (b.get('plan') ?? ''),
        ),
        switchMap((pm) => {
          const idStr = pm.get('id') ?? '';
          const id = Number(idStr);
          if (idStr && Number.isInteger(id) && id >= 1) {
            this.subscriptionId.set(id);
            this.isEditMode.set(true);
            return from(this.loadSubscription(id));
          }
          return from(
            (async () => {
              this.resetNewFormState();
              const planParam = pm.get('plan');
              if (planParam) {
                const pid = Number(planParam);
                if (pid > 0) {
                  const ps = String(pid);
                  if (this.recurringPlanOptionValues().has(ps)) {
                    this.recurringPlanId.set(ps);
                  }
                }
              }
            })(),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private resetNewFormState(): void {
    this.subscriptionLoadSeq++;
    this.subscriptionId.set(null);
    this.isEditMode.set(false);
    this.customerId.set('');
    this.selectedCustomerLabel.set('');
    this.templateId.set('');
    this.recurringPlanId.set('');
    this.paymentTermId.set('');
    this.startDate.set(new Date().toISOString().slice(0, 10));
    this.expiration.set('');
    this.currentStatus.set('DRAFT');
    this.subscriptionNumber.set('SO—');
    this.orderLines.set([]);
    this.draftLines.set([]);
    this.draftProductId.set('');
    this.draftQuantity.set(1);
    this.draftUnitPrice.set('');
    this.saveError.set(null);
    this.saveSuccess.set(false);
    this.actionError.set(null);
    this.actionSuccess.set(null);
    this.activeTab.set('order-lines');
    this.showCloseDialog.set(false);
  }

  /** Active-plan option ids (excludes the empty placeholder). */
  private recurringPlanOptionValues(): Set<string> {
    return new Set(
      this.recurringPlanOptions()
        .map((o) => o.value)
        .filter((v) => v !== ''),
    );
  }

  // ── Data loaders ──────────────────────────────────────────
  private async loadPlans() {
    try {
      const params = new HttpParams().set('page', '1').set('limit', '200').set('status', 'ACTIVE');
      const res = await firstValueFrom(
        this.http.get<{ success: boolean; data: { plans?: any[]; rows?: any[] } }>(PLAN_API, { params }),
      );
      const raw = res.data.plans ?? res.data.rows ?? [];
      const list = raw.filter(
        (p: { status?: string }) => String(p.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE',
      );
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
      await this.paymentTermStore.loadForSubscriptionDropdown();
      this.paymentTermOptions.set([
        { value: '', label: 'Select payment term' },
        ...this.paymentTermStore.activeTermsForSelect().map((t) => ({
          value: String(t.paymentTermId),
          label: t.termName,
        })),
      ]);
    } catch {
      /* keep empty */
    }
  }

  /** Active catalog products for line items (same cap as recurring plan editor). */
  private async loadProductCatalog() {
    const acc: ProductPick[] = [];
    try {
      let page = 1;
      let total = Infinity;
      const pageSize = 100;
      while (acc.length < total) {
        const params = new HttpParams()
          .set('page', String(page))
          .set('limit', String(pageSize))
          .set('status', 'ACTIVE');
        const res = await firstValueFrom(
          this.http.get<{ success: boolean; data: { products?: ProductPick[]; pagination?: { total: number } } }>(
            PRODUCTS_API,
            { params },
          ),
        );
        const batch = res.data?.products ?? [];
        total = res.data?.pagination?.total ?? batch.length;
        for (const p of batch) {
          acc.push({
            product_id: p.product_id,
            product_name: p.product_name,
            sales_price: p.sales_price ?? '0',
          });
        }
        if (batch.length === 0) break;
        page += 1;
        if (page > 100) break;
      }
      acc.sort((a, b) => a.product_name.localeCompare(b.product_name, undefined, { sensitivity: 'base' }));
      this.productCatalog.set(acc);
    } catch {
      this.productCatalog.set([]);
    }
  }

  onDraftProductSelect(ev: Event) {
    const v = (ev.target as HTMLSelectElement).value;
    this.onDraftProductChange(v);
  }

  onDraftProductChange(productIdStr: string) {
    this.draftProductId.set(productIdStr);
    if (!productIdStr) {
      this.draftUnitPrice.set('');
      return;
    }
    const p = this.productCatalog().find((x) => String(x.product_id) === productIdStr);
    if (p) {
      const n = parseFloat(String(p.sales_price ?? '0'));
      this.draftUnitPrice.set(Number.isFinite(n) ? String(n) : '0');
    }
  }

  addDraftLine() {
    const pid = this.draftProductId().trim();
    if (!pid) {
      this.saveError.set('Select a product to add a line.');
      return;
    }
    const product = this.productCatalog().find((x) => String(x.product_id) === pid);
    if (!product) {
      this.saveError.set('Selected product is not in the catalog.');
      return;
    }
    const qty = Math.floor(Number(this.draftQuantity()));
    if (!Number.isFinite(qty) || qty < 1) {
      this.saveError.set('Quantity must be at least 1.');
      return;
    }
    const unit = parseFloat(this.draftUnitPrice().trim());
    if (!Number.isFinite(unit) || unit < 0) {
      this.saveError.set('Unit price must be zero or greater.');
      return;
    }
    this.saveError.set(null);
    const key = `${pid}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    this.draftLines.update((rows) => [
      ...rows,
      {
        key,
        product_id: product.product_id,
        product_name: product.product_name,
        quantity: qty,
        unit_price: unit,
      },
    ]);
    this.draftProductId.set('');
    this.draftQuantity.set(1);
    this.draftUnitPrice.set('');
  }

  removeDraftLine(key: string) {
    this.draftLines.update((rows) => rows.filter((r) => r.key !== key));
  }

  draftLineAmount(line: DraftLine): number {
    return line.quantity * line.unit_price;
  }

  async loadSubscription(id: number) {
    const seq = ++this.subscriptionLoadSeq;
    this.isLoading.set(true);
    this.saveError.set(null);
    try {
      const [subRes, itemsRes] = await Promise.all([
        firstValueFrom(this.http.get<{ success: boolean; data: any }>(`${SUBS_API}/${id}`)),
        firstValueFrom(this.http.get<{ success: boolean; data: { items: OrderLine[] } }>(`${SUBS_API}/${id}/items`)),
      ]);
      if (seq !== this.subscriptionLoadSeq) return;
      const s = subRes.data ?? {};
      const rawNum = String(
        s.subscription_number ?? s.subscriptionNumber ?? s.subscription_id ?? s.subscriptionId ?? id,
      );
      this.subscriptionNumber.set(rawNum.startsWith('SO') ? rawNum : `SO${rawNum}`);
      this.currentStatus.set(String(s.status ?? 'DRAFT'));
      const custId = s.customer_id ?? s.customerId;
      this.customerId.set(custId != null && custId !== '' ? String(custId) : '');
      this.selectedCustomerLabel.set(String(s.customer_name ?? s.customerName ?? ''));
      const rawPlan = s.plan_id ?? s.planId;
      const planIdStr = rawPlan != null && rawPlan !== '' ? String(rawPlan) : '';
      this.recurringPlanId.set(planIdStr);
      if (planIdStr && planIdStr !== '0' && !this.recurringPlanOptionValues().has(planIdStr)) {
        this.recurringPlanId.set('');
        this.saveError.set(
          "This subscription's recurring plan is inactive or no longer available. Select an active plan before saving.",
        );
      }
      const rawTmpl = s.template_id ?? s.templateId;
      this.templateId.set(rawTmpl != null && rawTmpl !== '' ? String(rawTmpl) : '');
      const rawPay = s.payment_terms ?? s.paymentTerms;
      this.paymentTermId.set(rawPay != null && rawPay !== '' ? String(rawPay) : '');
      const expSrc = s.expiration_date ?? s.expirationDate;
      const expRaw = expSrc ? String(expSrc).slice(0, 10) : '';
      this.expiration.set(this.parseStrictIsoDate(expRaw) ?? '');
      const startSrc = s.start_date ?? s.startDate;
      const startRaw = startSrc ? String(startSrc).slice(0, 10) : '';
      const startOk = this.parseStrictIsoDate(startRaw);
      this.startDate.set(startOk ?? new Date().toISOString().slice(0, 10));
      const rawItems = (itemsRes.data?.items ?? []) as unknown[];
      this.orderLines.set(
        rawItems.map((row) => {
          const r = row as Record<string, unknown>;
          return {
            subscription_item_id: Number(r['subscription_item_id'] ?? r['subscriptionItemId'] ?? 0),
            product_id: Number(r['product_id'] ?? r['productId'] ?? 0),
            product_name: String(r['product_name'] ?? r['productName'] ?? ''),
            quantity: Number(r['quantity'] ?? 0),
            unit_price: String(r['unit_price'] ?? r['unitPrice'] ?? '0'),
            amount: String(r['amount'] ?? '0'),
          };
        }),
      );
    } catch (e: any) {
      if (seq !== this.subscriptionLoadSeq) return;
      this.saveError.set(e?.error?.message || e?.message || 'Failed to load subscription');
    } finally {
      if (seq === this.subscriptionLoadSeq) {
        this.isLoading.set(false);
      }
    }
  }

  // ── Customer typeahead callbacks ──────────────────────────
  onCustomerSelected(event: { id: string; label: string }) {
    this.customerId.set(event.id);
    this.selectedCustomerLabel.set(event.label);
    this.saveError.set(null);
  }

  async onCreateCustomer(name: string) {
    const customerName = name.trim();
    if (!customerName) return;
    this.isCreatingCustomer.set(true);
    this.saveError.set(null);
    try {
      const res = await firstValueFrom(
        this.http.post<{ success: boolean; data: Record<string, unknown> }>(CUSTOMERS_API, { customerName }),
      );
      const row = res.data ?? {};
      const id = Number(row['customer_id'] ?? row['customerId']);
      const label = String(row['customer_name'] ?? row['customerName'] ?? customerName).trim() || customerName;
      if (!Number.isInteger(id) || id < 1) {
        this.saveError.set('Customer was created but the response did not include a valid id.');
        return;
      }
      this.onCustomerSelected({ id: String(id), label });
    } catch (e: any) {
      this.saveError.set(
        e?.error?.message || e?.error?.errors?.[0] || e?.message || `Could not create customer "${customerName}".`,
      );
    } finally {
      this.isCreatingCustomer.set(false);
    }
  }

  /**
   * HTML date inputs use value YYYY-MM-DD. Reject impossible years (e.g. 6 digits) and invalid calendar dates.
   */
  private parseStrictIsoDate(s: string): string | null {
    const t = String(s ?? '')
      .trim()
      .slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
    const y = Number(t.slice(0, 4));
    const m = Number(t.slice(5, 7));
    const d = Number(t.slice(8, 10));
    if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
    return t;
  }

  onStartDateChange(raw: string) {
    const prev = this.startDate();
    if (raw === '' || raw == null) {
      this.startDate.set('');
      return;
    }
    const ok = this.parseStrictIsoDate(raw);
    if (ok) {
      this.startDate.set(ok);
      return;
    }
    this.startDate.set(prev);
  }

  onExpirationDateChange(raw: string) {
    const prev = this.expiration();
    if (raw === '' || raw == null) {
      this.expiration.set('');
      return;
    }
    const ok = this.parseStrictIsoDate(raw);
    if (ok) {
      this.expiration.set(ok);
      return;
    }
    this.expiration.set(prev);
  }

  // ── Save ──────────────────────────────────────────────────
  async onSave() {
    if (!this.customerId()) { this.saveError.set('Customer is required.'); return; }
    if (!this.recurringPlanId()) { this.saveError.set('Recurring plan is required.'); return; }
    const start = this.startDate().trim();
    if (start && !this.parseStrictIsoDate(start)) {
      this.saveError.set('Start date is not valid. Use the calendar or a four-digit year (1900–2100), format YYYY-MM-DD.');
      return;
    }
    const exp = this.expiration().trim();
    if (exp && !this.parseStrictIsoDate(exp)) {
      this.saveError.set('Expiration date is not valid. Use the calendar or a four-digit year (1900–2100), format YYYY-MM-DD.');
      return;
    }
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
        const res = await firstValueFrom(
          this.http.post<{ success: boolean; data: Record<string, unknown> }>(SUBS_API, body),
        );
        const data = res.data ?? {};
        const newId = Number(data['subscription_id'] ?? data['subscriptionId']);
        if (!Number.isInteger(newId) || newId < 1) {
          this.saveError.set('Subscription was saved but the server response did not include a subscription id.');
          return;
        }
        const lines = this.draftLines();
        try {
          for (const line of lines) {
            await firstValueFrom(
              this.http.post(`${SUBS_API}/${newId}/items`, {
                productId: line.product_id,
                quantity: line.quantity,
                unitPrice: line.unit_price,
              }),
            );
          }
          this.router.navigate([SUBSCRIPTION_APP_PATHS.subscriptions]);
        } catch (itemErr: any) {
          const msg =
            itemErr?.error?.message || itemErr?.error?.errors?.[0]?.message || itemErr?.message || 'Line item failed';
          this.subscriptionId.set(newId);
          this.isEditMode.set(true);
          this.draftLines.set([]);
          await this.loadSubscription(newId);
          this.saveError.set(
            `Subscription was created but adding a product line failed: ${msg}. Lines added before the error are kept; add any missing lines from the API or retry.`,
          );
        }
      }
    } catch (e: any) {
      this.saveError.set(e?.error?.message || e?.error?.errors?.[0]?.message || e?.message || 'Save failed');
    } finally {
      this.isSaving.set(false);
    }
  }

  // ── Status actions ────────────────────────────────────────
  async onSend() { await this.patchStatus('QUOTATION'); }
  async onConfirm() { await this.patchStatus('CONFIRMED'); }
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
  get isActive(): boolean { return this.currentStatus() === 'ACTIVE'; }

  onTabClick(tabId: 'order-lines' | 'other-info') {
    this.activeTab.set(tabId);
  }
}
