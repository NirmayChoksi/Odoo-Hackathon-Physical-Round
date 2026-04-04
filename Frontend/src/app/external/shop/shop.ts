import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ecommerceCommands } from '../ecommerce-navigation';
import { ButtonComponent } from '../../components/button/button';
import { CardComponent } from '../../components/card/card';
import { CATEGORIES, MOCK_PRODUCTS } from '../mock-products';
import { NavbarComponent } from '../shared/navbar/navbar';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, CardComponent, ButtonComponent],
  templateUrl: './shop.html',
  styleUrl: './shop.css'
})
export class ShopComponent implements OnInit {
  private route = inject(ActivatedRoute);
  readonly navLinkBase = this.route.snapshot.data['navLinkBase'] as string | undefined;

  categories = CATEGORIES;
  allProducts = MOCK_PRODUCTS;

  searchQuery = signal('');
  selectedCategory = signal('All');
  minPrice = signal(0);
  maxPrice = signal(5000);
  sortBy = signal<'default' | 'price-asc' | 'price-desc' | 'name'>('default');

  filteredProducts = computed(() => {
    let products = [...this.allProducts];

    // Category filter
    if (this.selectedCategory() !== 'All') {
      products = products.filter(p => p.category === this.selectedCategory());
    }

    // Search
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      products = products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    // Price range
    products = products.filter(p =>
      p.baseMonthlyPrice >= this.minPrice() &&
      p.baseMonthlyPrice <= this.maxPrice()
    );

    // Sort
    switch (this.sortBy()) {
      case 'price-asc': products.sort((a, b) => a.baseMonthlyPrice - b.baseMonthlyPrice); break;
      case 'price-desc': products.sort((a, b) => b.baseMonthlyPrice - a.baseMonthlyPrice); break;
      case 'name': products.sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return products;
  });

  private router = inject(Router);

  ngOnInit() {}

  selectCategory(cat: string) { this.selectedCategory.set(cat); }
  onSearchInputComponent(value: string) { this.searchQuery.set(value); }
  onSearchInput(event: Event) { this.searchQuery.set((event.target as HTMLInputElement).value); }
  resetSearch() { this.searchQuery.set(''); }
  onSort(val: string) { this.sortBy.set(val as any); }
  resetFilters() {
    this.searchQuery.set('');
    this.selectedCategory.set('All');
    this.minPrice.set(0);
    this.maxPrice.set(5000);
    this.sortBy.set('default');
  }
  goToProduct(id: number) {
    this.router.navigate(ecommerceCommands(this.navLinkBase, 'shop', id));
  }
}

