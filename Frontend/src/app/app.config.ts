import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { provideDevtoolsConfig } from '@angular-architects/ngrx-toolkit';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideStore(),
    ...(isDevMode() ? [provideDevtoolsConfig({ name: 'Signal stores' })] : []),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
  ],
};
