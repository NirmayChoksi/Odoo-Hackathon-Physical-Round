import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../shared/navbar/navbar';
import { ButtonComponent } from '../../components/button/button';
import { ecommerceCommands } from '../ecommerce-navigation';
import { OrdersStore } from '../orders/orders.store';

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [CommonModule, NavbarComponent, ButtonComponent],
  templateUrl: './order.html',
  styleUrl: './order.css',
})
export class OrderComponent implements OnInit, OnDestroy {
  readonly navLinkBase: string | undefined;
  readonly store = inject(OrdersStore);

  // Expose store signals
  readonly order = this.store.currentOrder;
  readonly isLoading = this.store.isLoading;
  readonly isActionLoading = this.store.isActionLoading;
  readonly error = this.store.error;

  orderNumber = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.navLinkBase = this.route.snapshot.data['navLinkBase'] as string | undefined;
  }

  async ngOnInit() {
    this.route.params.subscribe(async (params) => {
      if (params['id']) {
        this.orderNumber = params['id'];
        this.store.resetCurrentOrder();
        await this.store.loadDetail(this.orderNumber);
      }
    });
  }

  ngOnDestroy() {
    this.store.resetCurrentOrder();
  }

  goToInvoice(invoiceNumber: string) {
    this.router.navigate(ecommerceCommands(this.navLinkBase, 'invoice', invoiceNumber));
  }

  download() {
    window.print();
  }

  async renew() {
    const result = await this.store.renew(this.orderNumber);
    if (result.success) {
      alert('Order renewed successfully!');
      this.router.navigate(ecommerceCommands(this.navLinkBase, 'orders'));
    } else {
      alert(result.error ?? 'Failed to renew order.');
    }
  }

  async close() {
    if (!confirm('Are you sure you want to close this order?')) return;
    const result = await this.store.close(this.orderNumber);
    if (result.success) {
      this.router.navigate(ecommerceCommands(this.navLinkBase, 'orders'));
    } else {
      alert(result.error ?? 'Failed to close order.');
    }
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  formatAmount(amount: number | null | undefined): string {
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
