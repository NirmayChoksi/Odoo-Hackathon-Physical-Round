import type { Routes } from '@angular/router';

/** Child routes under `/subscription` (parent provides layout + `subscriptionStaffGuard`). */
export const subscriptionAppChildRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'subscriptions' },
  {
    path: 'subscriptions/new',
    loadComponent: () =>
      import('./subscriptions/subscription-form/subscription-form').then((m) => m.SubscriptionFormComponent),
  },
  {
    path: 'subscriptions',
    loadComponent: () => import('./subscriptions/subscriptions').then((m) => m.SubscriptionsComponent),
  },
  {
    path: 'configuration',
    loadComponent: () => import('./configuration/configuration').then((m) => m.ConfigurationComponent),
  },
  {
    path: 'products',
    loadComponent: () => import('./products/products').then((m) => m.ProductsComponent),
  },
  { path: 'reporting', redirectTo: 'subscriptions', pathMatch: 'full' },
  {
    path: 'users',
    loadComponent: () => import('./users/user-form/user-form').then((m) => m.UserFormComponent),
  },
  {
    path: 'contacts',
    loadComponent: () => import('./contacts/contact-form/contact-form').then((m) => m.ContactFormComponent),
  },
  { path: 'payment-term', redirectTo: 'quotation-template', pathMatch: 'full' },
  {
    path: 'quotation-template',
    loadComponent: () =>
      import('./quotation-template/quotation-template').then((m) => m.QuotationTemplateComponent),
  },
  {
    path: 'discount',
    loadComponent: () => import('./discount/discount').then((m) => m.DiscountComponent),
  },
  {
    path: 'taxes',
    loadComponent: () => import('./taxes/taxes').then((m) => m.TaxesComponent),
  },
  {
    path: 'attribute/new',
    loadComponent: () => import('./attribute/attribute-form').then((m) => m.AttributeFormComponent),
  },
  {
    path: 'attribute',
    loadComponent: () => import('./attribute/attribute-list').then((m) => m.AttributeListComponent),
  },
  {
    path: 'attribute/:id',
    loadComponent: () => import('./attribute/attribute-form').then((m) => m.AttributeFormComponent),
  },
  {
    path: 'recurring-plan',
    loadComponent: () => import('./recurring-plan/recurring-plan').then((m) => m.RecurringPlanComponent),
  },
];
