import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../shared/navbar/navbar';
import { CartService, CartItem } from '../services/cart.service';
import { ButtonComponent } from '../../components/button/button';
import { InputComponent } from '../../components/input/input';
import { ecommerceCommands } from '../ecommerce-navigation';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, NavbarComponent, ButtonComponent, InputComponent],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class CheckoutComponent implements OnInit {
  public cartService = inject(CartService);
  public router = inject(Router);
  private route = inject(ActivatedRoute);
  readonly navLinkBase = this.route.snapshot.data['navLinkBase'] as string | undefined;

  // States: 'address' -> 'payment' -> 'success'
  step = signal<'address' | 'payment' | 'success'>('address');

  // Address
  useDefaultAddress = signal(true);
  address = signal('123 Odoo Street, Hackathon City, India');

  // Order snapshot for success view
  finalOrderNumber = signal('');
  finalTotal = signal(0);
  finalSubtotal = signal(0);
  finalTaxes = signal(0);
  finalDiscountAmount = signal(0);
  finalItems = signal<CartItem[]>([]);

  get items() { return this.cartService.items; }
  get subtotal() { return this.cartService.subtotal; }
  get taxes() { return this.cartService.taxes; }
  get total() { return this.cartService.total; }

  ngOnInit() {
    if (this.items().length === 0 && this.step() !== 'success') {
      this.router.navigate(ecommerceCommands(this.navLinkBase, 'cart'));
    }
  }

  goToCartStep() {
    this.router.navigate(ecommerceCommands(this.navLinkBase, 'cart'));
  }

  goToPayment() {
    this.step.set('payment');
  }

  goToOrder() {
    this.router.navigate(ecommerceCommands(this.navLinkBase, 'order', this.finalOrderNumber()));
  }

  processPayment() {
    // Snapshot the order values
    this.finalOrderNumber.set('S' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'));
    this.finalSubtotal.set(this.subtotal());
    this.finalTaxes.set(this.taxes());
    this.finalTotal.set(this.total());
    this.finalDiscountAmount.set(this.cartService.discountAmount());
    this.finalItems.set([...this.items()]);

    // Clear cart and go to success
    this.cartService.clearCart();
    this.step.set('success');
  }

  printOrder() {
    window.print();
  }
}

