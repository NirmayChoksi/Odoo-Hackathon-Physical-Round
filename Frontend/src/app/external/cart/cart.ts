import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../shared/navbar/navbar';
import { CartService, CartItem } from '../services/cart.service';
import { ButtonComponent } from '../../components/button/button';
import { InputComponent } from '../../components/input/input';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, NavbarComponent, ButtonComponent, InputComponent],
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class CartComponent {
  public cartService = inject(CartService);
  public router = inject(Router);

  get items() { return this.cartService.items; }
  get subtotal() { return this.cartService.subtotal; }
  get taxes() { return this.cartService.taxes; }
  get total() { return this.cartService.total; }
  get discountAmount() { return this.cartService.discountAmount; }

  discountCode = '';
  discountMessage = '';

  increment(item: CartItem) {
    this.cartService.updateQuantity(item.id, item.quantity + 1);
  }

  decrement(item: CartItem) {
    if (item.quantity > 1) {
      this.cartService.updateQuantity(item.id, item.quantity - 1);
    }
  }

  removeItem(id: string) {
    this.cartService.removeItem(id);
  }
  
  onDiscountInput(val: string) {
    this.discountCode = val;
  }

  applyDiscount() {
    if (!this.discountCode.trim()) return;
    const success = this.cartService.applyDiscountCode(this.discountCode);
    if (success) {
      this.discountMessage = 'You have successfully applied the discount.';
    } else {
      this.discountMessage = 'Invalid discount code.';
    }
  }

  goToCheckout() {
    // Only proceed if there are items
    if (this.items().length > 0) {
      this.router.navigate(['/checkout']);
    }
  }
}

