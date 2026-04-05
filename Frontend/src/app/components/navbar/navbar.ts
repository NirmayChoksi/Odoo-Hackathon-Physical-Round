import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface NavItem {
  label: string;
  link?: string;
  active?: boolean;
}

type NavbarVariant = 'default' | 'glass';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar [class]="computedClasses()">
      <div class="flex justify-between items-center w-full max-w-full mx-auto px-4 lg:px-8">
        
        <!-- Left Section (Brand & Nav Items) -->
        <div class="flex items-center gap-8">
          
          <!-- Brand -->
          <div class="flex items-center gap-2 cursor-pointer" (click)="onBrandClick()">
            <ng-content select="[brandIcon]"></ng-content>
            <span *ngIf="brand()" class="text-2xl font-bold tracking-tighter text-primary font-['Epilogue']">
              {{ brand() }}
            </span>
          </div>

          <!-- Desktop Nav -->
          <div class="hidden md:flex gap-6">
            <span *ngFor="let item of items()"
              class="font-['Epilogue'] tracking-tight cursor-pointer font-medium transition-colors"
              [ngClass]="item.active 
                ? 'text-primary border-b-2 border-primary pb-1' 
                : 'text-outline-variant hover:text-primary'"
              (click)="onItemClick(item)">
              {{ item.label }}
            </span>
          </div>

        </div>

        <!-- Right Section (Actions) -->
        <div class="flex items-center gap-2 md:gap-4">
          <!-- Desktop Custom Actions -->
          <div class="hidden md:flex items-center gap-2">
            <ng-content></ng-content>
          </div>

          <!-- Mobile Menu Toggle -->
          <div class="md:hidden">
            <button mat-icon-button (click)="toggleMobileMenu()" class="!text-outline-variant hover:!text-primary">
              <mat-icon>{{ isMobileMenuOpen ? 'close' : 'menu' }}</mat-icon>
            </button>
          </div>
        </div>

      </div>
    </mat-toolbar>

    <!-- Mobile Navigation Drawer (Custom since MatSidenav is typically app-level) -->
    <div *ngIf="isMobileMenuOpen" class="md:hidden bg-surface-container-highest border-t border-outline-variant/10 shadow-xl overflow-hidden">
      <div class="flex flex-col px-4 py-4 space-y-4">
        <span *ngFor="let item of items()"
          class="font-['Epilogue'] tracking-tight text-lg cursor-pointer"
          [ngClass]="item.active ? 'text-primary font-bold' : 'text-outline-variant'"
          (click)="onItemClick(item)">
          {{ item.label }}
        </span>
        <div class="border-t border-outline-variant/10 pt-4 mt-2">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `
})
export class NavbarComponent {
  brand = input('');
  items = input<NavItem[]>([]);
  variant = input<NavbarVariant>('default');
  fixed = input(false);

  brandClick = output<void>();
  itemClick = output<NavItem>();

  isMobileMenuOpen = false;

  computedClasses = computed(() => {
    let base = '!h-20 ';
    
    if (this.fixed()) {
      base += '!fixed !top-0 !left-0 !right-0 !z-50 ';
    } else {
      base += '!sticky !top-0 !z-40 ';
    }

    if (this.variant() === 'glass') {
      base += '!bg-surface-bright/80 !backdrop-blur-xl !border-b !border-outline-variant/10 ';
    } else {
      base += '!bg-[#0c1b38] !shadow-none ';
    }

    return base;
  });

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  onBrandClick() {
    this.brandClick.emit();
  }

  onItemClick(item: NavItem) {
    this.isMobileMenuOpen = false; // close on click
    this.itemClick.emit(item);
  }
}
