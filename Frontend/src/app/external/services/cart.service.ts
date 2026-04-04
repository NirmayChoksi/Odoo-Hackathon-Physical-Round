import { Injectable, signal, computed } from '@angular/core';

export interface CartItem {
  id: string;
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  planDuration: 'monthly' | '6-month' | 'yearly';
  variantName?: string;
  image: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  // Signal holding the array of cart items
  readonly items = signal<CartItem[]>([]);

  // Computed signals for derived state
  readonly totalItems = computed(() => 
    this.items().reduce((acc, item) => acc + item.quantity, 0)
  );

  readonly subtotal = computed(() => 
    this.items().reduce((acc, item) => acc + (item.price * item.quantity), 0)
  );

  readonly taxes = computed(() => {
    // Flat 10% tax rate for prototype
    return this.subtotal() * 0.10;
  });

  readonly discountAmount = signal<number>(0);

  readonly total = computed(() => 
    this.subtotal() + this.taxes() - this.discountAmount()
  );

  addToCart(item: CartItem) {
    this.items.update(current => {
      // Check if exact same product + plan + variant exists
      const existingIndex = current.findIndex(
        i => i.productId === item.productId && 
             i.planDuration === item.planDuration && 
             i.variantName === item.variantName
      );

      if (existingIndex > -1) {
        // Update quantity
        const updated = [...current];
        updated[existingIndex].quantity += item.quantity;
        return updated;
      }
      
      // Add new item
      return [...current, { ...item, id: Math.random().toString(36).substring(2, 9) }];
    });
  }

  removeItem(id: string) {
    this.items.update(current => current.filter(item => item.id !== id));
  }

  updateQuantity(id: string, quantity: number) {
    this.items.update(current => 
      current.map(item => item.id === id ? { ...item, quantity } : item)
    );
  }

  applyDiscountCode(code: string): boolean {
    // Dummy discount logic
    if (code.toUpperCase() === 'SAVE10') {
      this.discountAmount.set(this.subtotal() * 0.10); // 10% off
      return true;
    } else if (code.toUpperCase() === 'FLAT50') {
      this.discountAmount.set(50);
      return true;
    }
    return false;
  }

  clearDiscount() {
    this.discountAmount.set(0);
  }

  clearCart() {
    this.items.set([]);
    this.discountAmount.set(0);
  }
}

