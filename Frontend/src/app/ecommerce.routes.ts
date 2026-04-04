import type { Routes } from '@angular/router';
import { ShopComponent } from './external/shop/shop';
import { ProductComponent } from './external/product/product';
import { CartComponent } from './external/cart/cart';
import { CheckoutComponent } from './external/checkout/checkout';
import { AccountComponent } from './external/account/account';

const navData = (navLinkBase: string | undefined) =>
  navLinkBase ? { navLinkBase } : {};

/** Base URL for storefront routes nested under the internal dashboard. */
export const INTERNAL_DASHBOARD_NAV_BASE = '/dashboard/internal' as const;

export function buildEcommerceRoutes(navLinkBase?: string): Routes {
  const data = navData(navLinkBase);
  return [
    { path: 'shop', component: ShopComponent, data },
    { path: 'shop/:id', component: ProductComponent, data },
    { path: 'cart', component: CartComponent, data },
    { path: 'checkout', component: CheckoutComponent, data },
    { path: 'account', component: AccountComponent, data },
    {
      path: 'orders',
      loadComponent: () => import('./external/orders/orders').then((m) => m.OrdersComponent),
      data,
    },
    {
      path: 'order/:id',
      loadComponent: () => import('./external/order/order').then((m) => m.OrderComponent),
      data,
    },
    {
      path: 'invoice/:orderId/:invId',
      loadComponent: () => import('./external/invoice/invoice').then((m) => m.InvoiceComponent),
      data,
    },
    {
      path: 'invoice/:invId',
      loadComponent: () => import('./external/invoice/invoice').then((m) => m.InvoiceComponent),
      data,
    },
  ];
}
