import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../../../external/shared/navbar/navbar';
import { ButtonComponent } from '../../../components/button/button';
import { ShopListResponse, ShopProductCard, SHOP_API_BASE, toShopProductCard } from '../../../external/shop/shop-api.types';

@Component({
  selector: 'app-portal-home',
  standalone: true,
  imports: [CommonModule, NavbarComponent, ButtonComponent],
  templateUrl: './portal-home.component.html',
  styleUrl: './portal-home.component.css',
})
export class PortalHomeComponent implements OnInit {
  featuredProducts: ShopProductCard[] = [];

  constructor(
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.http.get<ShopListResponse>(`${SHOP_API_BASE}/products?limit=4&sortBy=created_at&sortOrder=desc`)
      .subscribe({
        next: (res) => {
          if (res?.success && res.data) {
            this.featuredProducts = res.data.products.map(toShopProductCard);
            this.cdr.markForCheck();
          }
        },
        error: (e) => {
          console.error('Failed to load featured products', e);
        }
      });
  }

  goToShop() {
    this.router.navigate(['/shop']);
  }

  goToProduct(id: number) {
    this.router.navigate(['/shop', id]);
  }
}
