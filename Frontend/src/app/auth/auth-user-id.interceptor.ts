import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStore } from './auth.store';

/** Backend `requireUser` expects `x-user-id` (see Backend auth middleware). */
export const authUserIdInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthStore);
  const id = auth.user()?.id;
  if (
    id != null &&
    req.url.startsWith('/api/') &&
    !req.url.startsWith('/api/auth/')
  ) {
    return next(req.clone({ setHeaders: { 'x-user-id': String(id) } }));
  }
  return next(req);
};
