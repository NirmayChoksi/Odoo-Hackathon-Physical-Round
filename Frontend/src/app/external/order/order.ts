import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../shared/navbar/navbar';
import { ButtonComponent } from '../../components/button/button';
import { ecommerceCommands } from '../ecommerce-navigation';

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [CommonModule, NavbarComponent, ButtonComponent],
  templateUrl: './order.html',
  styleUrl: './order.css',
})
export class OrderComponent {
  readonly navLinkBase: string | undefined;

  orderId = signal('S0001');
  
  orderDetail = signal({
    subscriptionId: 'S00022',
    status: 'In Progress',
    plan: 'Premium Yearly',
    startDate: '06/02/2026',
    endDate: '06/02/2027',
    address: {
      name: 'Rohit Sharma',
      line: '123 Odoo Street',
      email: 'rohit@example.com',
      phone: '+91 98765 43210'
    },
    invoices: [
      { id: 'INV0015', status: 'Paid' }
    ],
    products: [
      { name: 'Product Name', qty: 2, price: 1200, tax: '15%', amount: 2400 },
      { name: '10% on your order', qty: 1, price: -120, tax: '', amount: -120 }
    ],
    subtotal: 2280,
    taxAmount: 360,
    total: 2640
  });

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.navLinkBase = this.route.snapshot.data['navLinkBase'] as string | undefined;
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.orderId.set(params['id']);
      }
    });
  }

  goToInvoice(invId: string) {
    this.router.navigate(ecommerceCommands(this.navLinkBase, 'invoice', invId));
  }

  download() {
    window.print();
  }

  renew() {
    alert('New order created successfully!');
    this.router.navigate(ecommerceCommands(this.navLinkBase, 'orders'));
  }

  close() {
    this.router.navigate(ecommerceCommands(this.navLinkBase, 'orders'));
  }
}
