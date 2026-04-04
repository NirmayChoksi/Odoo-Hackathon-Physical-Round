import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../shared/navbar/navbar';
import { MOCK_PRODUCTS, Product } from '../mock-products';
import { ButtonComponent } from '../../components/button/button';
import { CardComponent } from '../../components/card/card';
import { BadgeComponent } from '../../components/badge/badge';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NavbarComponent, ButtonComponent, CardComponent, BadgeComponent],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent {
  featuredProducts: Product[] = MOCK_PRODUCTS.slice(0, 4);

  constructor(private router: Router) {}

  goToShop() { this.router.navigate(['/shop']); }
  goToProduct(id: number) { this.router.navigate(['/shop', id]); }
}

