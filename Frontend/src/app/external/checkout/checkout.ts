import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../shared/navbar/navbar';
import { CartService } from '../services/cart.service';
import { ButtonComponent } from '../../components/button/button';
import { InputComponent } from '../../components/input/input';
import { Router } from '@angular/router';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, NavbarComponent, ButtonComponent, InputComponent],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class CheckoutComponent {
  public cartService = inject(CartService);
  public router = inject(Router);

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

  get items() { return this.cartService.items; }
  get subtotal() { return this.cartService.subtotal; }
  get taxes() { return this.cartService.taxes; }
  get total() { return this.cartService.total; }

  ngOnInit() {
    if (this.items().length === 0 && this.step() !== 'success') {
      this.router.navigate(['/cart']);
    }
  }

  goToPayment() {
    this.step.set('payment');
  }

  processPayment() {
    // Snapshot the order values
    this.finalOrderNumber.set('S' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'));
    this.finalSubtotal.set(this.subtotal());
    this.finalTaxes.set(this.taxes());
    this.finalTotal.set(this.total());

    // Clear cart and go to success
    this.cartService.clearCart();
    this.step.set('success');
  }

  printOrder() {
    window.print();
  }
}

