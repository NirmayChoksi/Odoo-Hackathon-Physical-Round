import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../shared/navbar/navbar';
import { ecommerceCommands } from '../ecommerce-navigation';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class OrdersComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  readonly navLinkBase = this.route.snapshot.data['navLinkBase'] as string | undefined;

  orders = signal([
    { id: 'S0001', date: '06/02/2026', total: 1200 },
    { id: 'S0002', date: '06/02/2026', total: 1800 },
  ]);

  goToOrder(orderId: string) {
    this.router.navigate(ecommerceCommands(this.navLinkBase, 'order', orderId));
  }
}
