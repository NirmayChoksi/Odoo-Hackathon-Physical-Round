import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog';
import {
  SUBSCRIPTION_APP_PATHS,
  subscriptionPaymentTermFormPath,
} from '../subscription-app.constants';
import type { DueType, StartFrom } from './payment-term.models';
import { PaymentTermStore } from './payment-term.store';

@Component({
  selector: 'app-payment-term-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ConfirmDialogComponent],
  templateUrl: './payment-term-form.html',
  styleUrl: './payment-term-form.css',
})
export class PaymentTermFormComponent implements OnInit, OnDestroy {
  readonly store = inject(PaymentTermStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly paths = SUBSCRIPTION_APP_PATHS;
  readonly formPath = subscriptionPaymentTermFormPath;

  readonly showDeleteDialog = signal(false);
  readonly showSuccessDialog = signal(false);
  readonly successDialogText = signal('');
  readonly pageSubtitle = signal('');

  dueTypes: DueType[] = ['IMMEDIATE', 'FIXED_DAYS', 'END_OF_MONTH', 'SPLIT_PAYMENT'];
  startFromOptions: StartFrom[] = ['INVOICE_DATE', 'SUBSCRIPTION_START_DATE'];

  private paramSub?: Subscription;

  ngOnInit(): void {
    this.paramSub = this.route.paramMap.subscribe((params) => {
      void this.syncRouteToStore(params.get('id'));
    });
  }

  ngOnDestroy(): void {
    this.paramSub?.unsubscribe();
  }

  private async syncRouteToStore(idParam: string | null): Promise<void> {
    if (!idParam || idParam === 'new') {
      this.store.resetFormToNew();
      this.pageSubtitle.set('Create a reusable due rule for subscriptions, quotations, and invoices.');
      return;
    }
    const n = Number(idParam);
    if (!Number.isInteger(n) || n < 1) {
      void this.router.navigateByUrl(this.paths.paymentTerm);
      return;
    }
    await this.store.selectTerm(n);
    this.pageSubtitle.set('Update due rules, installments, methods, and discounts.');
  }

  async saveTerm(): Promise<void> {
    const routeId = this.route.snapshot.paramMap.get('id');
    await this.store.save();
    const msg = this.store.message();
    if (msg && routeId === 'new') {
      const newId = this.store.selectedId();
      if (newId != null) {
        await this.router.navigateByUrl(this.formPath(newId), { replaceUrl: true });
      }
    }
    if (msg) {
      this.successDialogText.set(msg);
      this.showSuccessDialog.set(true);
      this.store.clearMessage();
    }
  }

  onReset(): void {
    const id = this.store.selectedId();
    const routeId = this.route.snapshot.paramMap.get('id');
    if (routeId === 'new' || id == null) {
      this.store.resetFormToNew();
    } else {
      void this.store.selectTerm(id);
    }
  }

  backToList(): void {
    void this.router.navigateByUrl(this.paths.paymentTerm);
  }

  onDelete(): void {
    if (this.store.selectedId() == null) return;
    this.showDeleteDialog.set(true);
  }

  closeDeleteDialog(): void {
    this.showDeleteDialog.set(false);
  }

  async performDelete(): Promise<void> {
    await this.store.remove();
    this.showDeleteDialog.set(false);
    if (!this.store.error()) {
      void this.router.navigateByUrl(this.paths.paymentTerm);
      return;
    }
    const msg = this.store.message();
    if (msg) {
      this.successDialogText.set(msg);
      this.showSuccessDialog.set(true);
      this.store.clearMessage();
    }
  }

  closeSuccessDialog(): void {
    this.showSuccessDialog.set(false);
    this.successDialogText.set('');
  }

  isEditMode(): boolean {
    return this.route.snapshot.paramMap.get('id') !== 'new' && this.store.selectedId() != null;
  }
}
