import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  isDevMode,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { provideDevtoolsConfig } from '@angular-architects/ngrx-toolkit';

import { AuthStore } from './auth/auth.store';
import { authUserIdInterceptor } from './auth/auth-user-id.interceptor';
import { ProfileStore } from './profile/profile.store';
import { ShopStore } from './external/shop/shop.store';
import { PaymentTermStore } from './internal/payment-term/payment-term.store';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authUserIdInterceptor])),
    provideAnimationsAsync(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    ...(isDevMode() ? [provideDevtoolsConfig({ name: 'Signal stores' })] : []),
    // AuthStore is otherwise only injected on auth routes; root inject registers it with
    // Redux DevTools immediately and loads token/user state for the whole app.
    provideAppInitializer(() => {
      inject(AuthStore);
      inject(ProfileStore);
      inject(ShopStore);
      inject(PaymentTermStore);
    }),
  ],
};
