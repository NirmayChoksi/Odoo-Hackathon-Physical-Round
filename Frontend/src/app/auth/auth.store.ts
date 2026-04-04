import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';

export type UserRole = 'Admin' | 'portal' | 'Internal';

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
  user: null,
  token: localStorage.getItem('token') || null,
  isLoading: false,
  error: null,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, http = inject(HttpClient)) => ({
    async login(email: string, password: string): Promise<{success: boolean, error?: string}> {
      patchState(store, { isLoading: true, error: null });
      try {
        const response = await firstValueFrom(
          http.post<any>('/api/auth/login', { email, password })
        );
        const token = response.data.token;
        const user: User = {
          id: response.data.user.id,
          full_name: response.data.user.full_name,
          email: response.data.user.email,
          role_id: response.data.user.role_id,
          status: response.data.user.status,
          role: 'portal'
        };
        localStorage.setItem('token', token);
        patchState(store, { user, token, isLoading: false });
        return { success: true };
      } catch (err) {
        let errorMsg = 'Failed to login';
        if (err instanceof HttpErrorResponse) {
          errorMsg = err.error?.error || err.error?.message || err.error || err.message;
        }
        patchState(store, { error: errorMsg, isLoading: false });
        return { success: false, error: errorMsg };
      }
    },

    async signup(name: string, email: string, password: string): Promise<{success: boolean, error?: string}> {
      patchState(store, { isLoading: true, error: null });
      try {
        await firstValueFrom(
          http.post<any>('/api/auth/signup', { full_name: name, email, password })
        );
        patchState(store, { isLoading: false });
        return { success: true };
      } catch (err) {
        let errorMsg = 'Signup failed';
        if (err instanceof HttpErrorResponse) {
          errorMsg = err.error?.error || err.error?.message || err.error || err.message;
        }
        patchState(store, { error: errorMsg, isLoading: false });
        return { success: false, error: errorMsg };
      }
    },

    async resetPassword(email: string): Promise<{success: boolean, error?: string}> {
      patchState(store, { isLoading: true, error: null });
      try {
        await firstValueFrom(
          http.post<any>('/api/auth/reset-password', { email })
        );
        patchState(store, { isLoading: false });
        return { success: true };
      } catch (err) {
        let errorMsg = 'Failed to reset password';
        if (err instanceof HttpErrorResponse) {
          errorMsg = err.error?.error || err.error?.message || err.error || err.message;
        }
        patchState(store, { error: errorMsg, isLoading: false });
        return { success: false, error: errorMsg };
      }
    },
    
    logout() {
      localStorage.removeItem('token');
      patchState(store, { user: null, token: null });
    }
  }))
);
