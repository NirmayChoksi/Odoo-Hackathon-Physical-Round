import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../shared/navbar/navbar';
import { MOCK_PRODUCTS, CATEGORIES, Product } from '../mock-products';
import { InputComponent } from '../../components/input/input';
import { CardComponent } from '../../components/card/card';
import { ButtonComponent } from '../../components/button/button';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, InputComponent, CardComponent, ButtonComponent],
  templateUrl: './shop.html',
  styleUrl: './shop.css'
})
export class ShopComponent implements OnInit {
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
      case 'price-asc':  products.sort((a, b) => a.baseMonthlyPrice - b.baseMonthlyPrice); break;
      case 'price-desc': products.sort((a, b) => b.baseMonthlyPrice - a.baseMonthlyPrice); break;
      case 'name':       products.sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return products;
  });

  constructor(private router: Router) {}
  ngOnInit() {}

  selectCategory(cat: string) { this.selectedCategory.set(cat); }
  onSearchInputComponent(value: string) { this.searchQuery.set(value); }
  onSort(val: string)         { this.sortBy.set(val as any); }
  resetFilters() {
    this.searchQuery.set('');
    this.selectedCategory.set('All');
    this.minPrice.set(0);
    this.maxPrice.set(5000);
    this.sortBy.set('default');
  }
  goToProduct(id: number) { this.router.navigate(['/shop', id]); }
}

