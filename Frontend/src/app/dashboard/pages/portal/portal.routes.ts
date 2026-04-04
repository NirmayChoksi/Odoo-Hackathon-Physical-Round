import type { Routes } from '@angular/router';
import { buildEcommerceRoutes } from '../../../ecommerce.routes';

/**
 * Public portal storefront + marketing home. Root URL `/` redirects to `/login` in `app.routes.ts`.
 */
export const portalPublicRoutes: Routes = [
  ...buildEcommerceRoutes(),
  {
    path: 'home',
    loadComponent: () => import('./portal-home.component').then((m) => m.PortalHomeComponent),
  },
];
