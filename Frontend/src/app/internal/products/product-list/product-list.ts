import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SUBSCRIPTION_APP_PATHS } from '../../subscription-app.constants';

const API = '/api/internal/products';

interface ProductRow {
  product_id: number;
  product_name: string;
  product_type: string;
  sales_price: string;
  cost_price: string;
  image_urls: string | null;
  short_description: string | null;
  status: string;
  is_recurring: number;
  created_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  readonly paths = SUBSCRIPTION_APP_PATHS;

  // Data
  products = signal<ProductRow[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = 20;
  isLoading = signal(false);
  loadError = signal<string | null>(null);

  // Filters (client-side on loaded page)
  searchQuery = signal('');
  selectedStatus = signal('All');

  categories = computed(() => {
    const types = [...new Set(this.products().map(p => p.product_type))];
    return ['All', ...types];
  });
  selectedCategory = signal('All');

  filteredProducts = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();
    const status = this.selectedStatus();
    return this.products().filter(p => {
      const matchQ = !q || p.product_name.toLowerCase().includes(q) || (p.short_description ?? '').toLowerCase().includes(q);
      const matchCat = cat === 'All' || p.product_type === cat;
      const matchStatus = status === 'All' || p.status === status;
      return matchQ && matchCat && matchStatus;
    });
  });

  totalPages = computed(() => Math.ceil(this.total() / this.pageSize) || 1);

  async ngOnInit() {
    await this.loadPage(1);
  }

  async loadPage(pg: number) {
    this.isLoading.set(true);
    this.loadError.set(null);
    try {
      const params = new HttpParams()
        .set('page', String(pg))
        .set('limit', String(this.pageSize));
      const res = await firstValueFrom(
        this.http.get<ApiResponse<{ products: ProductRow[]; pagination: { total: number } }>>(API, { params })
      );
      this.products.set(res.data?.products ?? []);
      this.total.set(res.data?.pagination?.total ?? 0);
      this.page.set(pg);
    } catch (e: any) {
      this.loadError.set(e?.error?.message || e?.message || 'Failed to load products');
    } finally {
      this.isLoading.set(false);
    }
  }

  prevPage() { if (this.page() > 1) void this.loadPage(this.page() - 1); }
  nextPage() { if (this.page() < this.totalPages()) void this.loadPage(this.page() + 1); }

  goToNew() { this.router.navigate([this.paths.productsNew]); }
  goToProduct(id: number) { this.router.navigate([this.paths.productsNew], { queryParams: { id } }); }

  clearFilters() {
    this.searchQuery.set('');
    this.selectedCategory.set('All');
    this.selectedStatus.set('All');
  }

  /** Thumbnail: first URL when `image_urls` is comma-separated. */
  productPreviewUrl(p: ProductRow): string | null {
    const raw = p.image_urls?.trim();
    if (!raw) return null;
    const first = raw.split(',')[0]?.trim();
    return first || null;
  }

}
