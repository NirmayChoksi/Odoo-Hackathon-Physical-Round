import { Routes } from '@angular/router';
import { HomeComponent } from './external/home/home';
import { ShopComponent } from './external/shop/shop';
import { ProductComponent } from './external/product/product';
import { CartComponent } from './external/cart/cart';
import { CheckoutComponent } from './external/checkout/checkout';
import { AccountComponent } from './external/account/account';

export const routes: Routes = [
<<<<<<< Updated upstream
  { path: 'login', loadComponent: () => import('./auth/login/login').then(m => m.Login) },
  { path: 'signup', loadComponent: () => import('./auth/signup/signup').then(m => m.Signup) },
  { path: 'reset-password', loadComponent: () => import('./auth/reset-password/reset-password').then(m => m.ResetPassword) },
  { path: 'update-password', loadComponent: () => import('./auth/update-password/update-password').then(m => m.UpdatePassword) },
  { path: 'subscriptions', loadComponent: () => import('./internal/subscriptions/subscriptions').then(m => m.SubscriptionsComponent) },
  { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
=======
  { path: '',         component: HomeComponent },
  { path: 'shop',     component: ShopComponent },
  { path: 'shop/:id', component: ProductComponent },
  { path: 'cart',     component: CartComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'account',  component: AccountComponent },
  { path: '**',       redirectTo: '' }
>>>>>>> Stashed changes
];
