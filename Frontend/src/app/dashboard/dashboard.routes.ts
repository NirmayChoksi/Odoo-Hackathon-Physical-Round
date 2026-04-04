import { Routes } from '@angular/router';
import {
  dashboardAuthGuard,
  dashboardDefaultRedirectGuard,
  dashboardRoleGuard,
} from './dashboard.guards';
import { DashboardComponent } from './dashboard.component';
import {
  buildEcommerceRoutes,
  INTERNAL_DASHBOARD_NAV_BASE,
} from '../ecommerce.routes';

export const dashboardRoutes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    canActivate: [dashboardAuthGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [dashboardDefaultRedirectGuard],
        loadComponent: () =>
          import('./dashboard-redirect-stub.component').then((m) => m.DashboardRedirectStubComponent),
      },
      {
        path: 'admin',
        canActivate: [dashboardRoleGuard(['Admin'])],
        loadComponent: () =>
          import('./pages/admin/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
      },
      {
        path: 'internal',
        canActivate: [dashboardRoleGuard(['Internal'])],
        children: [
          { path: '', pathMatch: 'full', redirectTo: '/subscription' },
          ...buildEcommerceRoutes(INTERNAL_DASHBOARD_NAV_BASE),
        ],
      },
      {
        path: 'portal',
        redirectTo: '/home',
        pathMatch: 'full',
      },
    ],
  },
];
