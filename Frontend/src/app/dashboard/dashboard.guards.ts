import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore, type UserRole } from '../auth/auth.store';

export function dashboardSegmentForRole(role: UserRole | undefined): 'admin' | 'internal' | 'portal' {
  if (role === 'Admin') return 'admin';
  if (role === 'Internal') return 'internal';
  return 'portal';
}

export const dashboardAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  if (!auth.token() || !auth.user()) {
    return router.createUrlTree(['/login']);
  }
  return true;
};

/** `/dashboard` → home for portal users; `/dashboard/admin` or `/dashboard/internal` for staff. */
export const dashboardDefaultRedirectGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  const role = auth.user()!.role ?? 'portal';
  if (role === 'portal') {
    return router.createUrlTree(['/home']);
  }
  const seg = dashboardSegmentForRole(role);
  return router.createUrlTree(['/dashboard', seg]);
};

export function dashboardRoleGuard(allowed: readonly UserRole[]): CanActivateFn {
  return () => {
    const auth = inject(AuthStore);
    const router = inject(Router);
    const role = auth.user()?.role ?? 'portal';
    if (!allowed.includes(role)) {
      if (role === 'portal') {
        return router.createUrlTree(['/home']);
      }
      return router.createUrlTree(['/dashboard', dashboardSegmentForRole(role)]);
    }
    return true;
  };
}
