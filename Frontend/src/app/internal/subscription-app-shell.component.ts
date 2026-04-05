import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { INTERNAL_DASHBOARD_NAV_BASE } from '../external/ecommerce-navigation';
import {
  CONFIGURATION_DROPDOWN_ITEMS,
  SUBSCRIPTION_APP_BASE,
  SUBSCRIPTION_APP_PATHS,
  USERS_CONTACTS_DROPDOWN_ITEMS,
} from './subscription-app.constants';

@Component({
  selector: 'app-subscription-app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './subscription-app-shell.component.html',
  styleUrl: './subscription-app-shell.component.css',
})
export class SubscriptionAppShellComponent {
  readonly paths = SUBSCRIPTION_APP_PATHS;
  readonly configItems = CONFIGURATION_DROPDOWN_ITEMS;
  readonly usersItems = USERS_CONTACTS_DROPDOWN_ITEMS;

  configOpen = signal(false);
  usersOpen = signal(false);

  constructor(private router: Router) {}

  @HostListener('document:click')
  onDocumentClick(): void {
    this.configOpen.set(false);
    this.usersOpen.set(false);
  }

  toggleConfig(event: Event): void {
    event.stopPropagation();
    this.configOpen.update((v) => !v);
    this.usersOpen.set(false);
  }

  toggleUsers(event: Event): void {
    event.stopPropagation();
    this.usersOpen.update((v) => !v);
    this.configOpen.set(false);
  }

  closeFlyouts(): void {
    this.configOpen.set(false);
    this.usersOpen.set(false);
  }

  isConfigRoute(): boolean {
    const u = this.router.url.split('?')[0];
    const prefixes = [
      `${SUBSCRIPTION_APP_BASE}/configuration`,
      `${SUBSCRIPTION_APP_BASE}/attribute`,
      `${SUBSCRIPTION_APP_BASE}/recurring-plans`,
      `${SUBSCRIPTION_APP_BASE}/recurring-plan`,
      `${SUBSCRIPTION_APP_BASE}/quotation-templates`,
      `${SUBSCRIPTION_APP_BASE}/quotation-template`,
      `${SUBSCRIPTION_APP_BASE}/payment-term`,
      `${SUBSCRIPTION_APP_BASE}/discounts`,
      `${SUBSCRIPTION_APP_BASE}/discount`,
      `${SUBSCRIPTION_APP_BASE}/taxes`,
      `${SUBSCRIPTION_APP_BASE}/tax`,
    ];
    return prefixes.some((p) => u.startsWith(p));
  }

  private staffStorefrontBase(): string | null {
    const url = this.router.url.split('?')[0];
    if (url.startsWith('/dashboard/internal') || url.startsWith(SUBSCRIPTION_APP_BASE)) {
      return INTERNAL_DASHBOARD_NAV_BASE;
    }
    return null;
  }

  accountLink(): string {
    const b = this.staffStorefrontBase();
    return b ? `${b}/account` : '/account';
  }
}
