import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../shared/navbar/navbar';
import { ecommerceCommands } from '../ecommerce-navigation';
import { OrdersStore } from './orders.store';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class OrdersComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  readonly store = inject(OrdersStore);
  readonly navLinkBase = this.route.snapshot.data['navLinkBase'] as string | undefined;

  // Expose store signals
  readonly orders = this.store.orders;
  readonly isLoading = this.store.isLoading;
  readonly error = this.store.error;
  readonly pagination = this.store.pagination;

  async ngOnInit() {
    await this.store.loadAll({ page: 1, limit: 20 });
  }

  goToOrder(orderNumber: string) {
    this.router.navigate(ecommerceCommands(this.navLinkBase, 'order', orderNumber));
  }

  async loadPage(page: number) {
    const p = this.pagination();
    await this.store.loadAll({ page, limit: p?.limit ?? 20 });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  formatAmount(amount: number): string {
    if (amount == null) return '—';
    return `₹${Number(amount).toFixed(2)}`;
  }

  getStatusClass(status: string): string {
    const s = (status || '').toUpperCase();
    if (s === 'ACTIVE') return 'badge badge-active';
    if (s === 'CLOSED') return 'badge badge-closed';
    if (s === 'CONFIRMED') return 'badge badge-confirmed';
    if (s === 'DRAFT' || s === 'QUOTATION') return 'badge badge-draft';
    return 'badge';
  }
}
