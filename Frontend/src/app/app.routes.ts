import { Routes } from '@angular/router';
import { portalPublicRoutes } from './dashboard/pages/portal/portal.routes';
import { subscriptionStaffGuard } from './dashboard/dashboard.guards';
import { subscriptionAppChildRoutes } from './internal/subscription-app.routes';

/** Old top-level URLs → `/subscription/...` (bookmarks and old links). */
const subscriptionLegacyRedirects: Routes = [
  { path: 'subscriptions/new', redirectTo: 'subscription/subscriptions/new', pathMatch: 'full' },
  { path: 'subscriptions', redirectTo: 'subscription/subscriptions', pathMatch: 'full' },
  { path: 'configuration', redirectTo: 'subscription/configuration', pathMatch: 'full' },
  { path: 'products', redirectTo: 'subscription/products', pathMatch: 'full' },
  { path: 'reporting', redirectTo: 'subscription/reporting', pathMatch: 'full' },
  { path: 'users', redirectTo: 'subscription/users', pathMatch: 'full' },
  { path: 'contacts', redirectTo: 'subscription/contacts', pathMatch: 'full' },
  { path: 'payment-term', redirectTo: 'subscription/payment-term', pathMatch: 'full' },
  { path: 'quotation-template', redirectTo: 'subscription/quotation-template', pathMatch: 'full' },
  { path: 'discount', redirectTo: 'subscription/discount', pathMatch: 'full' },
  { path: 'taxes', redirectTo: 'subscription/taxes', pathMatch: 'full' },
  { path: 'tax', redirectTo: 'subscription/tax', pathMatch: 'full' },
  { path: 'attribute/new', redirectTo: 'subscription/attribute/new', pathMatch: 'full' },
  { path: 'attribute', redirectTo: 'subscription/attribute', pathMatch: 'full' },
  { path: 'attribute/:id', redirectTo: 'subscription/attribute/:id', pathMatch: 'full' },
  { path: 'recurring-plan', redirectTo: 'subscription/recurring-plan', pathMatch: 'full' },
];

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./auth/login/login').then((m) => m.Login) },
  { path: 'signup', loadComponent: () => import('./auth/signup/signup').then((m) => m.Signup) },
  {
    path: 'reset-password',
    loadComponent: () => import('./auth/reset-password/reset-password').then((m) => m.ResetPassword),
  },
  {
    path: 'update-password',
    loadComponent: () => import('./auth/update-password/update-password').then((m) => m.UpdatePassword),
  },
  ...subscriptionLegacyRedirects,
  {
    path: 'subscription',
    canActivate: [subscriptionStaffGuard],
    loadComponent: () =>
      import('./internal/subscription-app-shell.component').then((m) => m.SubscriptionAppShellComponent),
    children: subscriptionAppChildRoutes,
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard.routes').then((m) => m.dashboardRoutes),
  },
  ...portalPublicRoutes,
  { path: '', pathMatch: 'full', redirectTo: '/login' },
  { path: '**', redirectTo: '/login' },
];
