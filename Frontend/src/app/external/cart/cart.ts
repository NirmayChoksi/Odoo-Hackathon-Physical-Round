import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ecommerceCommands } from '../ecommerce-navigation';
import { CartItem, CartService } from '../services/cart.service';
import { NavbarComponent } from '../shared/navbar/navbar';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class CartComponent {
  public cartService = inject(CartService);
  public router = inject(Router);
  private route = inject(ActivatedRoute);
  readonly navLinkBase = this.route.snapshot.data['navLinkBase'] as string | undefined;

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
    } else {
      // qty is 1, remove this item and navigate to its product page
      this.cartService.removeItem(item.id);
      // Extract the product id from the cart item id (format: productId_variantName_planLabel)
      const productId = item.id.split('_')[0];
      this.router.navigate(ecommerceCommands(this.navLinkBase, 'shop', Number(productId)));
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
    if (this.items().length > 0) {
      this.router.navigate(ecommerceCommands(this.navLinkBase, 'checkout'));
    }
  }

  continueShopping() {
    this.router.navigate(ecommerceCommands(this.navLinkBase, 'shop'));
  }
}

