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
    children: [
      {
        path: '',
        loadComponent: () => import('./users/user-list/user-list').then((m) => m.UserListComponent),
      },
      {
        path: ':id',
        loadComponent: () => import('./users/user-form/user-form').then((m) => m.UserFormComponent),
      },
    ]
  },
  {
    path: 'contacts',
    children: [
      {
        path: '',
        loadComponent: () => import('./contacts/contact-list/contact-list').then((m) => m.ContactListComponent),
      },
      {
        path: ':id',
        loadComponent: () => import('./contacts/contact-form/contact-form').then((m) => m.ContactFormComponent),
      },
    ]
  },
  {
    path: 'payment-term/:id',
    loadComponent: () =>
      import('./payment-term/payment-term-form').then((m) => m.PaymentTermFormComponent),
  },
  {
    path: 'payment-term',
    loadComponent: () =>
      import('./payment-term/payment-term-list').then((m) => m.PaymentTermListComponent),
  },
  {
    path: 'quotation-template',
    loadComponent: () =>
      import('./quotation-template/quotation-template').then((m) => m.QuotationTemplateComponent),
  },
  {
    path: 'discount/new',
    loadComponent: () => import('./discount/discount').then((m) => m.DiscountComponent),
  },
  {
    path: 'discounts',
    loadComponent: () => import('./discount/discount-list').then((m) => m.DiscountListComponent),
  },
  {
    path: 'discount',
    loadComponent: () =>
      import('./discount/discount-legacy-redirect.component').then((m) => m.DiscountLegacyRedirectComponent),
  },
  {
    path: 'tax/new',
    loadComponent: () => import('./taxes/taxes').then((m) => m.TaxesComponent),
  },
  {
    path: 'taxes',
    loadComponent: () => import('./taxes/tax-list').then((m) => m.TaxListComponent),
  },
  {
    path: 'tax',
    loadComponent: () =>
      import('./taxes/tax-legacy-redirect.component').then((m) => m.TaxLegacyRedirectComponent),
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
    path: 'recurring-plan/new',
    loadComponent: () => import('./recurring-plan/recurring-plan').then((m) => m.RecurringPlanComponent),
  },
  {
    path: 'recurring-plans',
    loadComponent: () =>
      import('./recurring-plan/recurring-plan-list').then((m) => m.RecurringPlanListComponent),
  },
  {
    path: 'recurring-plan',
    loadComponent: () =>
      import('./recurring-plan/recurring-plan-legacy-redirect.component').then(
        (m) => m.RecurringPlanLegacyRedirectComponent,
      ),
  },
];
