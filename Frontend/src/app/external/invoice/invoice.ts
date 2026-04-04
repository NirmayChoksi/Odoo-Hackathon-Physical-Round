import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../shared/navbar/navbar';
import { ButtonComponent } from '../../components/button/button';
import { ecommerceCommands } from '../ecommerce-navigation';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [CommonModule, NavbarComponent, ButtonComponent],
  templateUrl: './invoice.html',
  styleUrl: './invoice.css',
})
export class InvoiceComponent {
  readonly navLinkBase: string | undefined;

  orderId = signal('S0001');
  invId = signal('001');

  invoiceDetail = signal({
    invoiceNumber: 'INV/0015',
    invoiceDate: '06/02/2026',
    dueDate: '20/02/2026',
    source: 'SO0022',
    address: {
      name: 'Rohit Sharma',
      line: '123 Odoo Street',
      email: 'rohit@example.com'
    },
    products: [
      { name: 'Product Name', qty: 2, price: 1200, tax: '15%', amount: 2400 },
      { name: '10% on your order', qty: 1, price: -120, tax: '', amount: -120 }
    ],
    paymentTerms: 'Immediate Payment',
    subtotal: 2280,
    taxAmount: 360,
    total: 2640,
    paidOn: '-',
    paidAmount: 0,
    amountDue: 2640
  });

  constructor(private router: Router, private route: ActivatedRoute) {
    this.navLinkBase = this.route.snapshot.data['navLinkBase'] as string | undefined;
    this.route.params.subscribe((params) => {
      if (params['orderId']) {
        this.orderId.set(params['orderId']);
      }
      if (params['invId']) {
        this.invId.set(params['invId']);
      }
    });
  }

  goBack() {
    this.router.navigate(ecommerceCommands(this.navLinkBase, 'order', this.orderId()));
  }

  download() {
    window.print();
  }

  pay() {
    alert('Redirecting to payment gateway... Payment successful!');
    this.invoiceDetail.update(d => {
      return { ...d, paidAmount: d.total, amountDue: 0, paidOn: new Date().toLocaleDateString('en-GB') };
    });
  }
}
