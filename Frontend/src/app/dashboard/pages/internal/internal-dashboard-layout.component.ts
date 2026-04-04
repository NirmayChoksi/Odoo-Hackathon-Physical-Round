import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthStore } from '../../../auth/auth.store';

@Component({
  selector: 'app-internal-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div
      class="border-b px-4 py-3 text-sm"
      style="border-color: var(--color-outline); background: rgba(30, 41, 59, 0.5); color: var(--color-on-surface-variant)"
    >
      Internal user: {{ auth.user()?.full_name }} — subscriptions home below; use the shop and account links in the nav when
      you open those sections.
    </div>
    <router-outlet />
  `,
})
export class InternalDashboardLayoutComponent {
  readonly auth = inject(AuthStore);
}
