import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./auth/login/login').then(m => m.Login) },
  { path: 'signup', loadComponent: () => import('./auth/signup/signup').then(m => m.Signup) },
  { path: 'reset-password', loadComponent: () => import('./auth/reset-password/reset-password').then(m => m.ResetPassword) },
  { path: 'update-password', loadComponent: () => import('./auth/update-password/update-password').then(m => m.UpdatePassword) },
  { path: 'subscriptions', loadComponent: () => import('./internal/subscriptions/subscriptions').then(m => m.SubscriptionsComponent) },
  { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
