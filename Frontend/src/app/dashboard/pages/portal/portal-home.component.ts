import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../external/shared/navbar/navbar';
import { MOCK_PRODUCTS, Product } from '../../../external/mock-products';
import { ButtonComponent } from '../../../components/button/button';
import { CardComponent } from '../../../components/card/card';
import { BadgeComponent } from '../../../components/badge/badge';

@Component({
  selector: 'app-portal-home',
  standalone: true,
  imports: [CommonModule, NavbarComponent, ButtonComponent, CardComponent, BadgeComponent],
  templateUrl: './portal-home.component.html',
  styleUrl: './portal-home.component.css',
})
export class PortalHomeComponent {
  featuredProducts: Product[] = MOCK_PRODUCTS.slice(0, 4);

  constructor(private router: Router) {}

  goToShop() {
    this.router.navigate(['/shop']);
  }

  goToProduct(id: number) {
    this.router.navigate(['/shop', id]);
  }
}
