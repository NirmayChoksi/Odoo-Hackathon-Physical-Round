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
    path: 'products/new',
    loadComponent: () =>
      import('./products/product-form/products').then((m) => m.ProductsComponent),
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./products/product-list/product-list').then((m) => m.ProductListComponent),
  },
  {
    path: 'reporting',
    loadComponent: () => import('./reporting/reporting').then((m) => m.ReportingComponent),
  },
  {
    path: 'users',
    loadComponent: () => import('./users/user-form/user-form').then((m) => m.UserFormComponent),
  },
  {
    path: 'contacts',
    loadComponent: () => import('./contacts/contact-form/contact-form').then((m) => m.ContactFormComponent),
  },
  {
    path: 'payment-term',
    loadComponent: () => import('./payment-term/payment-term').then((m) => m.PaymentTermComponent),
  },
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
