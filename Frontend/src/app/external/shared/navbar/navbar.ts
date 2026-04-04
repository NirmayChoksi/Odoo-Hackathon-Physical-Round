import { Component, signal, HostListener, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-external-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  private router = inject(Router);
  public cartService = inject(CartService);

  profileOpen = signal(false);
  mobileMenuOpen = signal(false);

  cartCount = computed(() => this.cartService.totalItems());

  navItems = [
    { label: 'Home', route: '/' },
    { label: 'Shop', route: '/shop' },
    { label: 'My Account', route: '/account' },
  ];

  toggleProfile() {
    this.profileOpen.update(v => !v);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update(v => !v);
  }

  goTo(route: string) {
    this.mobileMenuOpen.set(false);
    this.profileOpen.set(false);
    this.router.navigate([route]);
  }

  signOut() {
    this.profileOpen.set(false);
    // stub  hook to auth service later
    alert('Signed out!');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('#profile-menu-container')) {
      this.profileOpen.set(false);
    }
  }
}

