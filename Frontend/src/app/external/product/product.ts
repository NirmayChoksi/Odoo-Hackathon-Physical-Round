import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NavbarComponent } from '../shared/navbar/navbar';
import { ButtonComponent } from '../../components/button/button';
import { CartService, CartItem } from '../services/cart.service';
import { ecommerceCommands, INTERNAL_DASHBOARD_NAV_BASE } from '../ecommerce-navigation';
import { ProductStore, ProductPlan, ProductVariant } from './product.store';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, ButtonComponent],
  templateUrl: './product.html',
  styleUrl: './product.css'
})
export class ProductComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public cartService = inject(CartService);
  public productStore = inject(ProductStore);

  readonly navLinkBase = this.route.snapshot.data['navLinkBase'] as string | undefined;

  selectedImageIndex = signal(0);
  selectedPlanIndex = signal(0);
  selectedVariant = signal<ProductVariant | null>(null);
  quantity = signal(1);
  addedToCart = signal(false);

  /** Per-unit price: plan price + variant extra. Falls back to display_price when no plans. */
  currentPrice = computed(() => {
    const product = this.productStore.product();
    const plans = this.productStore.plans();

    if (!product) return 0;
    if (plans.length === 0) {
      return parseFloat(product.display_price || product.sales_price || '0') || 0;
    }

    const plan = plans[this.selectedPlanIndex()];
    if (!plan) return 0;

    const planPrice = parseFloat(plan.price) || 0;
    const variant = this.selectedVariant();
    const extraPrice = variant ? (parseFloat(variant.extra_price) || 0) : 0;

    return planPrice + extraPrice;
  });

  /** Total price shown on the Add to Cart button = unit price × quantity */
  totalPrice = computed(() => this.currentPrice() * this.quantity());

  apiTargetBase(): string {
    return this.navLinkBase === INTERNAL_DASHBOARD_NAV_BASE
      ? '/api/internal/shop'
      : '/api/external/shop';
  }

  constructor() { }

  async ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    await this.productStore.loadProduct(this.apiTargetBase(), id);

    const variants = this.productStore.variants();
    if (variants.length > 0) {
      this.selectedVariant.set(variants[0]);
    }

    const plans = this.productStore.plans();
    const defaultPlanIndex = plans.findIndex(p => p.is_default);
    if (defaultPlanIndex !== -1) {
      this.selectedPlanIndex.set(defaultPlanIndex);
    }
  }

  selectImage(i: number) { this.selectedImageIndex.set(i); }
  prevImage() {
    const imgs = this.productStore.images();
    this.selectedImageIndex.update(i => (i > 0 ? i - 1 : imgs.length - 1));
  }
  nextImage() {
    const imgs = this.productStore.images();
    this.selectedImageIndex.update(i => (i < imgs.length - 1 ? i + 1 : 0));
  }
  selectPlan(i: number) { this.selectedPlanIndex.set(i); }
  selectVariant(v: ProductVariant) { this.selectedVariant.set(v); }
  increment() { this.quantity.update(q => q + 1); }
  decrement() { this.quantity.update(q => (q > 1 ? q - 1 : 1)); }

  addToCart() {
    const product = this.productStore.product();
    if (!product) return;

    const plans = this.productStore.plans();
    const plan = plans[this.selectedPlanIndex()];
    const imgUrl = this.productStore.images()[0] || 'https://placehold.co/600x400/e2e8f0/64748b?text=Product';

    const cartItem: CartItem = {
      id: '', // Service fills this
      productId: product.product_id,
      productName: product.product_name,
      price: this.currentPrice(),
      quantity: this.quantity(),
      planDuration: (plan ? plan.billing_period.toLowerCase() : 'monthly') as any,
      variantName: this.selectedVariant()?.attribute_value,
      image: imgUrl
    };

    this.cartService.addToCart(cartItem);

    this.addedToCart.set(true);
    setTimeout(() => this.addedToCart.set(false), 2000);
  }

  goBack() {
    this.router.navigate(ecommerceCommands(this.navLinkBase, 'shop'));
  }

  goHome() {
    this.router.navigate(ecommerceCommands(this.navLinkBase));
  }
}

