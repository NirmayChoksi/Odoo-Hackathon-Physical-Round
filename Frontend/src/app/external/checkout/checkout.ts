import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ecommerceCommands } from '../ecommerce-navigation';
import { CartService } from '../services/cart.service';
import { NavbarComponent } from '../shared/navbar/navbar';
import { CheckoutStore } from './checkout.store';
import { CheckoutAddress } from './checkout-api.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class CheckoutComponent implements OnInit {
  public cartService = inject(CartService);
  public router = inject(Router);
  public store = inject(CheckoutStore);
  private route = inject(ActivatedRoute);
  
  readonly navLinkBase = this.route.snapshot.data['navLinkBase'] as string | undefined;

  // Local state for UI flow
  step = signal<'address' | 'payment' | 'success'>('address');
  
  // Form models
  newAddress = {
    fullName: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false
  };

  dummyCard = {
    number: '4242 4242 4242 4242',
    expiry: '12/28',
    cvc: '123',
    name: 'Odoo Demo User'
  };

  // User-requested order lines signal for success state
  orderLines = signal<any[]>([]);

  // Expose store signals
  addresses = this.store.addresses;
  selectedAddressId = this.store.selectedAddressId;
  isLoading = this.store.isLoading;
  isPlacingOrder = this.store.isPlacingOrder;
  error = this.store.error;
  placedOrder = this.store.placedOrder;

  // Helper selectors
  selectedAddress = computed(() => 
    this.addresses().find(a => a.address_id === this.selectedAddressId())
  );

  get items() { return this.cartService.items; }
  get subtotal() { return this.cartService.subtotal; }
  get taxes() { return this.cartService.taxes; }
  get total() { return this.cartService.total; }

  async ngOnInit() {
    if (this.items().length === 0 && this.step() !== 'success' && !this.placedOrder()) {
      this.router.navigate(ecommerceCommands(this.navLinkBase, 'cart'));
      return;
    }
    await this.store.loadAddresses();
  }

  goToCartStep() {
    this.router.navigate(ecommerceCommands(this.navLinkBase, 'cart'));
  }

  goToPayment() {
    if (!this.selectedAddressId()) {
      alert('Please select or add an address first.');
      return;
    }
    this.step.set('payment');
  }

  selectAddress(id: number) {
    this.store.selectAddress(id);
  }

  async saveNewAddress() {
    const res = await this.store.saveAddress(this.newAddress);
    if (res.success) {
      this.goToPayment();
    } else {
      alert(res.error || 'Failed to save address');
    }
  }

  async processPayment() {
    // Process payment using the store
    const result = await this.store.placeOrder();
    
    if (result.success && result.order) {
      // Integrate USER snippet for orderLines mapping
      const rawItems = (result.order as any).items || [];
      this.orderLines.set(
        rawItems.map((row: Record<string, unknown>) => ({
          subscription_item_id: Number(row['subscription_item_id'] ?? row['subscriptionItemId'] ?? 0),
          product_id: Number(row['product_id'] ?? row['productId'] ?? 0),
          product_name: String(row['product_name'] ?? row['productName'] ?? ''),
          quantity: Number(row['quantity'] ?? 0),
          unit_price: String(row['unit_price'] ?? row['unitPrice'] ?? '0'),
          amount: String(row['amount'] ?? '0'),
        }))
      );

      // If API doesn't return items directly, we might need a fallback from current cart
      if (this.orderLines().length === 0) {
        this.orderLines.set(this.items().map(i => ({
          product_name: i.productName,
          quantity: i.quantity,
          unit_price: i.price.toString(),
          amount: (i.price * i.quantity).toString()
        })));
      }

      this.cartService.clearCart();
      this.step.set('success');
    } else {
      alert(result.error || 'Checkout failed');
    }
  }

  goToOrder() {
    const orderNum = this.placedOrder()?.order_number;
    if (orderNum) {
      this.router.navigate(ecommerceCommands(this.navLinkBase, 'order', orderNum));
    }
  }

  printOrder() {
    window.print();
  }
}
