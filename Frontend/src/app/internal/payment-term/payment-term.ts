import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SUBSCRIPTION_APP_PATHS } from '../subscription-app.constants';
import { PaymentTermApiService } from './payment-term-api.service';
import type {
  DueType,
  PaymentMethodCode,
  PaymentTermDto,
  StartFrom,
} from './payment-term.models';

interface EditableInstallment {
  installmentId?: number;
  installmentNumber: number;
  percentage: number;
  dueAfterDays: number;
  description: string;
}

@Component({
  selector: 'app-payment-term',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-term.html',
  styleUrl: './payment-term.css',
})
export class PaymentTermComponent {
  private readonly api = inject(PaymentTermApiService);
  private readonly router = inject(Router);

  termsList = signal<PaymentTermDto[]>([]);
  selectedId = signal<number | null>(null);
  loading = signal(false);
  saving = signal(false);
  message = signal<string | null>(null);
  error = signal<string | null>(null);

  termName = signal('');
  description = signal('');
  dueType = signal<DueType>('FIXED_DAYS');
  days = signal<number | null>(30);
  graceDays = signal(0);
  startFrom = signal<StartFrom>('INVOICE_DATE');
  isDefault = signal(false);
  status = signal<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  enableLateFee = signal(false);
  lateFeeType = signal<'FIXED' | 'PERCENTAGE'>('PERCENTAGE');
  lateFeeValue = signal<number | null>(null);
  lateFeeAfterDays = signal<number | null>(null);

  enableEarlyDiscount = signal(false);
  earlyDiscountType = signal<'FIXED' | 'PERCENTAGE'>('PERCENTAGE');
  earlyDiscountValue = signal<number | null>(null);
  earlyDiscountWithinDays = signal<number | null>(null);

  notes = signal('');
  internalRemarks = signal('');

  installments = signal<EditableInstallment[]>([]);

  methodCard = signal(false);
  methodBank = signal(false);
  methodUpi = signal(false);
  methodCash = signal(false);
  defaultMethod = signal<PaymentMethodCode | null>('BANK_TRANSFER');

  dueTypes: DueType[] = ['IMMEDIATE', 'FIXED_DAYS', 'END_OF_MONTH', 'SPLIT_PAYMENT'];
  startFromOptions: StartFrom[] = ['INVOICE_DATE', 'SUBSCRIPTION_START_DATE'];
  methodCodes: PaymentMethodCode[] = ['CARD', 'BANK_TRANSFER', 'UPI', 'CASH'];

  constructor() {
    void this.refreshList();
  }

  showSplitSection(): boolean {
    return this.dueType() === 'SPLIT_PAYMENT';
  }

  async refreshList() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(this.api.list(1, 100));
      if (!res.success) throw new Error(res.message);
      this.termsList.set(res.data.terms);
    } catch (e) {
      this.error.set(this.httpErr(e));
    } finally {
      this.loading.set(false);
    }
  }

  private httpErr(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      const body = e.error as { message?: string; errors?: string[] } | undefined;
      return body?.errors?.join('; ') ?? body?.message ?? e.message;
    }
    return e instanceof Error ? e.message : 'Request failed';
  }

  resetFormToNew() {
    this.selectedId.set(null);
    this.termName.set('');
    this.description.set('');
    this.dueType.set('FIXED_DAYS');
    this.days.set(30);
    this.graceDays.set(0);
    this.startFrom.set('INVOICE_DATE');
    this.isDefault.set(false);
    this.status.set('ACTIVE');
    this.enableLateFee.set(false);
    this.lateFeeType.set('PERCENTAGE');
    this.lateFeeValue.set(null);
    this.lateFeeAfterDays.set(null);
    this.enableEarlyDiscount.set(false);
    this.earlyDiscountType.set('PERCENTAGE');
    this.earlyDiscountValue.set(null);
    this.earlyDiscountWithinDays.set(null);
    this.notes.set('');
    this.internalRemarks.set('');
    this.installments.set([
      { installmentNumber: 1, percentage: 50, dueAfterDays: 0, description: '' },
      { installmentNumber: 2, percentage: 50, dueAfterDays: 30, description: '' },
    ]);
    this.methodCard.set(false);
    this.methodBank.set(true);
    this.methodUpi.set(true);
    this.methodCash.set(false);
    this.defaultMethod.set('BANK_TRANSFER');
    this.message.set(null);
    this.error.set(null);
  }

  onNew() {
    this.resetFormToNew();
  }

  async selectTerm(id: number) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(this.api.get(id));
      if (!res.success) throw new Error(res.message);
      this.applyPageData(res.data);
      this.selectedId.set(id);
      this.message.set(null);
    } catch (e) {
      this.error.set(this.httpErr(e));
    } finally {
      this.loading.set(false);
    }
  }

  private applyPageData(data: import('./payment-term.models').PaymentTermPageData) {
    const t = data.paymentTerm;
    this.termName.set(t.termName);
    this.description.set(t.description ?? '');
    this.dueType.set(t.dueType);
    this.days.set(t.days);
    this.graceDays.set(t.graceDays);
    this.startFrom.set(t.startFrom);
    this.isDefault.set(t.isDefault);
    this.status.set(t.status);
    this.enableLateFee.set(t.enableLateFee);
    this.lateFeeType.set((t.lateFeeType as 'FIXED' | 'PERCENTAGE') ?? 'PERCENTAGE');
    this.lateFeeValue.set(t.lateFeeValue);
    this.lateFeeAfterDays.set(t.lateFeeAfterDays);
    this.enableEarlyDiscount.set(t.enableEarlyDiscount);
    this.earlyDiscountType.set((t.earlyDiscountType as 'FIXED' | 'PERCENTAGE') ?? 'PERCENTAGE');
    this.earlyDiscountValue.set(t.earlyDiscountValue);
    this.earlyDiscountWithinDays.set(t.earlyDiscountWithinDays);
    this.notes.set(t.notes ?? '');
    this.internalRemarks.set(t.internalRemarks ?? '');
    this.installments.set(
      data.installments.map((i) => ({
        installmentId: i.installmentId,
        installmentNumber: i.installmentNumber,
        percentage: i.percentage,
        dueAfterDays: i.dueAfterDays,
        description: i.description ?? '',
      }))
    );
    const codes = new Set(data.methods.map((m) => m.paymentMethod));
    this.methodCard.set(codes.has('CARD'));
    this.methodBank.set(codes.has('BANK_TRANSFER'));
    this.methodUpi.set(codes.has('UPI'));
    this.methodCash.set(codes.has('CASH'));
    const def = data.methods.find((m) => m.isDefault);
    this.defaultMethod.set(def?.paymentMethod ?? null);
  }

  private buildMethodsPayload(): { paymentMethod: PaymentMethodCode; isDefault: boolean }[] {
    const out: { paymentMethod: PaymentMethodCode; isDefault: boolean }[] = [];
    const d = this.defaultMethod();
    const add = (on: boolean, code: PaymentMethodCode) => {
      if (on) out.push({ paymentMethod: code, isDefault: d === code });
    };
    add(this.methodCard(), 'CARD');
    add(this.methodBank(), 'BANK_TRANSFER');
    add(this.methodUpi(), 'UPI');
    add(this.methodCash(), 'CASH');
    if (out.length && !out.some((m) => m.isDefault)) {
      out[0] = { ...out[0], isDefault: true };
    }
    return out;
  }

  private buildBody(): Record<string, unknown> {
    const inst = this.installments().map((r) => ({
      installmentNumber: r.installmentNumber,
      percentage: r.percentage,
      dueAfterDays: r.dueAfterDays,
      description: r.description || null,
    }));
    return {
      termName: this.termName().trim(),
      description: this.description().trim() || null,
      dueType: this.dueType(),
      days: this.days(),
      graceDays: this.graceDays(),
      startFrom: this.startFrom(),
      isDefault: this.isDefault(),
      status: this.status(),
      enableLateFee: this.enableLateFee(),
      lateFeeType: this.enableLateFee() ? this.lateFeeType() : null,
      lateFeeValue: this.enableLateFee() ? this.lateFeeValue() : null,
      lateFeeAfterDays: this.enableLateFee() ? this.lateFeeAfterDays() : null,
      enableEarlyDiscount: this.enableEarlyDiscount(),
      earlyDiscountType: this.enableEarlyDiscount() ? this.earlyDiscountType() : null,
      earlyDiscountValue: this.enableEarlyDiscount() ? this.earlyDiscountValue() : null,
      earlyDiscountWithinDays: this.enableEarlyDiscount() ? this.earlyDiscountWithinDays() : null,
      notes: this.notes().trim() || null,
      internalRemarks: this.internalRemarks().trim() || null,
      installments: this.showSplitSection() ? inst : [],
      methods: this.buildMethodsPayload(),
    };
  }

  async onSave() {
    this.saving.set(true);
    this.error.set(null);
    this.message.set(null);
    try {
      const body = this.buildBody();
      const id = this.selectedId();
      if (id == null) {
        const res = await firstValueFrom(this.api.create(body));
        if (!res.success) throw new Error(res.message);
        this.applyPageData(res.data);
        this.selectedId.set(res.data.paymentTerm.paymentTermId);
        this.message.set('Payment term created.');
      } else {
        const res = await firstValueFrom(this.api.update(id, body));
        if (!res.success) throw new Error(res.message);
        this.applyPageData(res.data);
        this.message.set('Payment term updated.');
      }
      await this.refreshList();
    } catch (e) {
      this.error.set(this.httpErr(e));
    } finally {
      this.saving.set(false);
    }
  }

  onReset() {
    const id = this.selectedId();
    if (id == null) this.resetFormToNew();
    else void this.selectTerm(id);
  }

  onCancel() {
    void this.router.navigateByUrl(SUBSCRIPTION_APP_PATHS.configuration);
  }

  async onDelete() {
    const id = this.selectedId();
    if (id == null) return;
    if (!confirm('Delete this payment term?')) return;
    this.saving.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(this.api.remove(id));
      if (!res.success) throw new Error(res.message);
      this.message.set('Deleted.');
      this.resetFormToNew();
      await this.refreshList();
    } catch (e) {
      this.error.set(this.httpErr(e));
    } finally {
      this.saving.set(false);
    }
  }

  addInstallmentRow() {
    const rows = this.installments();
    const next = rows.length ? Math.max(...rows.map((r) => r.installmentNumber)) + 1 : 1;
    this.installments.set([...rows, { installmentNumber: next, percentage: 0, dueAfterDays: 0, description: '' }]);
  }

  removeInstallmentRow(index: number) {
    const rows = [...this.installments()];
    rows.splice(index, 1);
    this.installments.set(rows);
  }

  patchInst(index: number, key: keyof EditableInstallment, value: string | number) {
    const rows = [...this.installments()];
    const cur = { ...rows[index] };
    if (key === 'installmentNumber' || key === 'percentage' || key === 'dueAfterDays') {
      const n = typeof value === 'string' ? Number(value) : value;
      (cur as Record<string, unknown>)[key] = Number.isFinite(n) ? n : 0;
    } else {
      (cur as Record<string, unknown>)[key] = value;
    }
    rows[index] = cur;
    this.installments.set(rows);
  }

  setDefaultMethod(v: string) {
    if (!v) {
      this.defaultMethod.set(null);
      return;
    }
    this.defaultMethod.set(v as PaymentMethodCode);
  }
}
