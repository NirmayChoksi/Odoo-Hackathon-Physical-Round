import { inject, isDevMode } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { updateState, withDevtools, withDevToolsStub } from '@angular-architects/ngrx-toolkit';
import { signalStore, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';

export type UserRole = 'Admin' | 'portal' | 'Internal';

/** Matches `roles` in `Backend/subscription_management.sql`: 1 Admin, 2 Internal, 3 External (portal). */
export function roleIdToUserRole(roleId?: number): UserRole {
  if (roleId === 1) return 'Admin';
  if (roleId === 2) return 'Internal';
  return 'portal';
}

const AUTH_USER_KEY = 'auth_user';

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw) as User;
    if (u && u.role === undefined && u.role_id !== undefined) {
      u.role = roleIdToUserRole(u.role_id);
    }
    return u;
  } catch {
    return null;
  }
}

const storedToken = localStorage.getItem('token');
const storedUser = storedToken ? readStoredUser() : null;

export interface User {
  id?: number;
  full_name: string;
  email: string;
  role_id?: number;
  status?: string;
  role?: UserRole;
}

type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: AuthState = {
  user: storedUser,
  token: storedToken,
  isLoading: false,
  error: null,
};

const authDevtools = isDevMode() ? withDevtools('auth') : withDevToolsStub('auth');

export const AuthStore = signalStore(
  { providedIn: 'root' },
  authDevtools,
  withState(initialState),
  withMethods((store, http = inject(HttpClient)) => ({
    async login(email: string, password: string): Promise<{success: boolean, error?: string}> {
      updateState(store, '[Auth] Login', { isLoading: true, error: null });
      try {
        const response = await firstValueFrom(
          http.post<any>('/api/auth/login', { email, password })
        );
        const token = response.data.token;
        const role_id = response.data.user.role_id as number | undefined;
        const user: User = {
          id: response.data.user.id,
          full_name: response.data.user.full_name,
          email: response.data.user.email,
          role_id,
          status: response.data.user.status,
          role: roleIdToUserRole(role_id),
        };
        localStorage.setItem('token', token);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        updateState(store, '[Auth] Login Success', { user, token, isLoading: false });
        return { success: true };
      } catch (err) {
        let errorMsg = 'Failed to login';
        if (err instanceof HttpErrorResponse) {
          errorMsg = err.error?.error || err.error?.message || err.error || err.message;
        }
        updateState(store, '[Auth] Login Failure', { error: errorMsg, isLoading: false });
        return { success: false, error: errorMsg };
      }
    },

    async signup(name: string, email: string, password: string): Promise<{success: boolean, error?: string}> {
      updateState(store, '[Auth] Signup', { isLoading: true, error: null });
      try {
        await firstValueFrom(
          http.post<any>('/api/auth/signup', { full_name: name, email, password })
        );
        updateState(store, '[Auth] Signup Success', { isLoading: false });
        return { success: true };
      } catch (err) {
        let errorMsg = 'Signup failed';
        if (err instanceof HttpErrorResponse) {
          errorMsg = err.error?.error || err.error?.message || err.error || err.message;
        }
        updateState(store, '[Auth] Signup Failure', { error: errorMsg, isLoading: false });
        return { success: false, error: errorMsg };
      }
    },

    async resetPassword(email: string): Promise<{success: boolean, error?: string}> {
      updateState(store, '[Auth] Reset Password', { isLoading: true, error: null });
      try {
        await firstValueFrom(
          http.post<any>('/api/auth/reset-password', { email })
        );
        updateState(store, '[Auth] Reset Password Success', { isLoading: false });
        return { success: true };
      } catch (err) {
        let errorMsg = 'Failed to reset password';
        if (err instanceof HttpErrorResponse) {
          errorMsg = err.error?.error || err.error?.message || err.error || err.message;
        }
        updateState(store, '[Auth] Reset Password Failure', { error: errorMsg, isLoading: false });
        return { success: false, error: errorMsg };
      }
    },
    async verifyReset(email: string, token: string, newPassword: string): Promise<{success: boolean, error?: string}> {
      updateState(store, '[Auth] Verify Reset', { isLoading: true, error: null });
      try {
        await firstValueFrom(
          http.post<any>('/api/auth/verify-reset', { email, token, newPassword })
        );
        updateState(store, '[Auth] Verify Reset Success', { isLoading: false });
        return { success: true };
      } catch (err) {
        let errorMsg = 'Failed to update password';
        if (err instanceof HttpErrorResponse) {
          errorMsg = err.error?.error || err.error?.message || err.error || err.message;
        }
        updateState(store, '[Auth] Verify Reset Failure', { error: errorMsg, isLoading: false });
        return { success: false, error: errorMsg };
      }
    },
    
    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem(AUTH_USER_KEY);
      updateState(store, '[Auth] Logout', { user: null, token: null });
    },

    /** Keep session user in sync after profile PATCH (full_name / email). */
    syncUserFromProfile(updates: Pick<User, 'full_name' | 'email'>) {
      const u = store.user();
      if (!u) return;
      const next: User = { ...u, ...updates };
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(next));
      updateState(store, '[Auth] Sync Profile', { user: next });
    },
  }))
);
