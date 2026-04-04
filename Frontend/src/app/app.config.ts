import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  isDevMode,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { provideDevtoolsConfig } from '@angular-architects/ngrx-toolkit';

import { AuthStore } from './auth/auth.store';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    ...(isDevMode() ? [provideDevtoolsConfig({ name: 'Signal stores' })] : []),
    // AuthStore is otherwise only injected on auth routes; root inject registers it with
    // Redux DevTools immediately and loads token/user state for the whole app.
    provideAppInitializer(() => {
      inject(AuthStore);
    }),
  ],
};
