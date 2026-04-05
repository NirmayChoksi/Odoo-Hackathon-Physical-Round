import { Component, signal, HostListener, inject, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { ecommerceCommands, INTERNAL_DASHBOARD_NAV_BASE } from '../../ecommerce-navigation';
import { AuthStore } from '../../../auth/auth.store';
import { ProfileStore } from '../../../profile/profile.store';

@Component({
  selector: 'app-external-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent {
  private router = inject(Router);
  public cartService = inject(CartService);
  private authStore = inject(AuthStore);
  private profileStore = inject(ProfileStore);

  /** When set (e.g. `/dashboard/internal`), cart/account/orders use that prefix. */
  linkBase = input<string | undefined>(undefined);

  profileOpen = signal(false);
  mobileMenuOpen = signal(false);

  cartCount = computed(() => this.cartService.totalItems());

  /** Staff view under `/dashboard/internal`: storefront chrome hidden; profile menu is Account + Sign out only. */
  isInternalLayout = computed(() => this.linkBase() === INTERNAL_DASHBOARD_NAV_BASE);

  navItems = computed(() => {
    const b = this.linkBase();
    if (b === INTERNAL_DASHBOARD_NAV_BASE) {
      return [] as { label: string; link: (string | number)[]; exact: boolean }[];
    }
    return [
      { label: 'Home', link: ecommerceCommands(b), exact: true },
      { label: 'Shop', link: ecommerceCommands(b, 'shop'), exact: false },
      { label: 'My Account', link: ecommerceCommands(b, 'account'), exact: false },
    ];
  });

  cmd(...segments: (string | number)[]) {
    return ecommerceCommands(this.linkBase(), ...segments);
  }

  toggleProfile() {
    this.profileOpen.update((v) => !v);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update((v) => !v);
  }

  signOut() {
    this.profileOpen.set(false);
    this.mobileMenuOpen.set(false);
    this.profileStore.reset();
    this.authStore.logout();
    void this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('#profile-menu-container')) {
      this.profileOpen.set(false);
    }
  }
}
