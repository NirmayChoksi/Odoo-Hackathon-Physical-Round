import { Routes } from '@angular/router';
import { portalPublicRoutes } from './dashboard/pages/portal/portal.routes';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./auth/login/login').then(m => m.Login) },
  { path: 'signup', loadComponent: () => import('./auth/signup/signup').then(m => m.Signup) },
  { path: 'reset-password', loadComponent: () => import('./auth/reset-password/reset-password').then(m => m.ResetPassword) },
  { path: 'update-password', loadComponent: () => import('./auth/update-password/update-password').then(m => m.UpdatePassword) },
  { path: 'subscriptions/new', loadComponent: () => import('./internal/subscriptions/subscription-form/subscription-form').then(m => m.SubscriptionFormComponent) },
  { path: 'subscriptions', loadComponent: () => import('./internal/subscriptions/subscriptions').then(m => m.SubscriptionsComponent) },
  { path: 'quotation-template', loadComponent: () => import('./internal/quotation-template/quotation-template').then(m => m.QuotationTemplateComponent) },
  { path: 'discount', loadComponent: () => import('./internal/discount/discount').then(m => m.DiscountComponent) },
  { path: 'taxes', loadComponent: () => import('./internal/taxes/taxes').then(m => m.TaxesComponent) },
  { path: 'recurring-plan', loadComponent: () => import('./internal/recurring-plan/recurring-plan').then(m => m.RecurringPlanComponent) },
  { path: 'invoice/:invId', loadComponent: () => import('./external/invoice/invoice').then(m => m.InvoiceComponent) },
  { path: 'invoice/:orderId/:invId', loadComponent: () => import('./external/invoice/invoice').then(m => m.InvoiceComponent) },
  {
    path: 'reset-password',
    loadComponent: () => import('./auth/reset-password/reset-password').then((m) => m.ResetPassword),
  },
  {
    path: 'update-password',
    loadComponent: () => import('./auth/update-password/update-password').then((m) => m.UpdatePassword),
  },
  {
    path: 'subscriptions/new',
    loadComponent: () =>
      import('./internal/subscriptions/subscription-form/subscription-form').then(
        (m) => m.SubscriptionFormComponent,
      ),
  },
  {
    path: 'subscriptions',
    loadComponent: () => import('./internal/subscriptions/subscriptions').then((m) => m.SubscriptionsComponent),
  },
  {
    path: 'quotation-template',
    loadComponent: () =>
      import('./internal/quotation-template/quotation-template').then((m) => m.QuotationTemplateComponent),
  },
  { path: 'discount', loadComponent: () => import('./internal/discount/discount').then((m) => m.DiscountComponent) },
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard.routes').then((m) => m.dashboardRoutes),
  },
  ...portalPublicRoutes,
  { path: '', pathMatch: 'full', redirectTo: '/login' },
  {
    path: '**',
    redirectTo: '/login',
  },
];
