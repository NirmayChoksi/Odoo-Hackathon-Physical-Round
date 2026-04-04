import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ecommerceCommands } from '../ecommerce-navigation';
import { ButtonComponent } from '../../components/button/button';
import { CardComponent } from '../../components/card/card';
import { NavbarComponent } from '../shared/navbar/navbar';
import { SelectComponent, SelectOption } from '../../components/select/select';
import type { ShopSortUi } from './shop.store';
import { ShopStore } from './shop.store';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NavbarComponent,
    CardComponent,
    ButtonComponent,
    SelectComponent,
  ],
  templateUrl: './shop.html',
  styleUrl: './shop.css',
})
export class ShopComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly shopStore = inject(ShopStore);
  readonly navLinkBase = this.route.snapshot.data['navLinkBase'] as string | undefined;

  readonly sortOptions: SelectOption[] = [
    { value: 'default', label: 'Default' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'name', label: 'Name A–Z' },
  ];

  ngOnInit(): void {
    void this.shopStore.initializeShop();
  }

  goToProduct(id: number): void {
    this.router.navigate(ecommerceCommands(this.navLinkBase, 'shop', id));
  }

  onSort(val: string): void {
    this.shopStore.setSortBy(val as ShopSortUi);
  }
}
