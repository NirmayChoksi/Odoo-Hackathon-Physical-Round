import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NavbarComponent } from '../shared/navbar/navbar';
import { getProductById, calculatePricingPlans, Product, ProductVariant, SubscriptionPlan } from '../mock-products';
import { ButtonComponent } from '../../components/button/button';
import { CartService, CartItem } from '../services/cart.service';
import { ecommerceCommands } from '../ecommerce-navigation';

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
  readonly navLinkBase = this.route.snapshot.data['navLinkBase'] as string | undefined;

  product: Product | undefined;
  pricingPlans: SubscriptionPlan[] = [];

  selectedImageIndex = signal(0);
  selectedPlanIndex  = signal(0);
  selectedVariant    = signal<ProductVariant | null>(null);
  quantity           = signal(1);
  addedToCart        = signal(false);

  currentPrice = computed(() => {
    if (!this.product || this.pricingPlans.length === 0) return 0;
    const plan    = this.pricingPlans[this.selectedPlanIndex()];
    if (!plan) return 0;
    const variant = this.selectedVariant();
    const extra   = variant ? variant.extraPrice : 0;

    if (this.selectedPlanIndex() === 0) return plan.perMonth + extra;
    if (this.selectedPlanIndex() === 1) return Math.round(plan.perMonth + extra * 0.9);
    return Math.round(plan.perMonth + extra * 0.7);
  });

  constructor() {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.product = getProductById(id);
    if (this.product) {
      this.pricingPlans = calculatePricingPlans(this.product.baseMonthlyPrice);
      this.selectedVariant.set(this.product.variants[0]);
    }
  }

  selectImage(i: number)   { this.selectedImageIndex.set(i); }
  selectPlan(i: number)    { this.selectedPlanIndex.set(i); }
  selectVariant(v: ProductVariant) { this.selectedVariant.set(v); }
  increment() { this.quantity.update(q => q + 1); }
  decrement() { this.quantity.update(q => (q > 1 ? q - 1 : 1)); }

  addToCart() {
    if (!this.product) return;
    
    const plan = this.pricingPlans[this.selectedPlanIndex()];
    const cartItem: CartItem = {
      id: '', // Service fills this
      productId: this.product.id,
      productName: this.product.name,
      price: plan.perMonth,
      quantity: this.quantity(),
      planDuration: plan.id,
      variantName: this.selectedVariant()?.name,
      image: this.product.images[0]
    };
    
    if (plan.id === 'yearly') {
      cartItem.price = plan.total;
    } else if (plan.id === '6-month') {
      cartItem.price = plan.total;
    } else {
      cartItem.price = plan.perMonth;
    }

    if (this.selectedVariant()?.extraPrice) {
       let multiplier = 1;
       if(plan.id === 'yearly') multiplier = 12;
       if(plan.id === '6-month') multiplier = 6;
       cartItem.price += (this.selectedVariant()!.extraPrice * multiplier);
    }

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

