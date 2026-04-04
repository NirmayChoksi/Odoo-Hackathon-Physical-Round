import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Hosts internal staff routes under `/subscription` (see `app.routes.ts`). */
@Component({
  selector: 'app-subscription-app-shell',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class SubscriptionAppShellComponent {}
