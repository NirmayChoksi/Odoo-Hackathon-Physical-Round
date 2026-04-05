import { inject, isDevMode } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { updateState, withDevtools, withDevToolsStub } from '@angular-architects/ngrx-toolkit';
import { signalStore, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { AttributeApiService } from './attribute-api.service';

type AttributeState = {
  attributes: any[];
  currentAttribute: any | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: AttributeState = {
  attributes: [],
  currentAttribute: null,
  isLoading: false,
  error: null,
};

const devtools = isDevMode() ? withDevtools('attribute') : withDevToolsStub('attribute');

export const AttributeStore = signalStore(
  { providedIn: 'root' },
  devtools,
  withState(initialState),
  withMethods((store, api = inject(AttributeApiService)) => ({
    async loadAll(): Promise<void> {
      updateState(store, '[Attribute] Load All', { isLoading: true, error: null });
      try {
        const response = await firstValueFrom(api.list());
        if (response.success) {
          updateState(store, '[Attribute] Load All Success', { attributes: response.data, isLoading: false });
        }
      } catch (err) {
        let errorMsg = 'Failed to load attributes';
        if (err instanceof HttpErrorResponse) {
          errorMsg = err.error?.error || err.error?.message || err.error || err.message;
        }
        updateState(store, '[Attribute] Load All Failure', { error: errorMsg, isLoading: false });
      }
    },

    async loadOne(id: number): Promise<{ success: boolean; data?: any; error?: string }> {
      updateState(store, '[Attribute] Load One', { isLoading: true, error: null });
      try {
        const response = await firstValueFrom(api.get(id));
        if (response.success) {
          updateState(store, '[Attribute] Load One Success', { currentAttribute: response.data, isLoading: false });
          return { success: true, data: response.data };
        }
        return { success: false, error: 'Failed' };
      } catch (err) {
        let errorMsg = 'Failed to load attribute';
        if (err instanceof HttpErrorResponse) {
          errorMsg = err.error?.error || err.error?.message || err.error || err.message;
        }
        updateState(store, '[Attribute] Load One Failure', { error: errorMsg, isLoading: false });
        return { success: false, error: errorMsg };
      }
    },

    async create(body: any): Promise<{ success: boolean; data?: any; error?: string }> {
      updateState(store, '[Attribute] Create', { isLoading: true, error: null });
      try {
        const response = await firstValueFrom(api.create(body));
        updateState(store, '[Attribute] Create Success', { isLoading: false });
        // Optionally reload list or just return
        return { success: true, data: response.data };
      } catch (err) {
        let errorMsg = 'Failed to create attribute';
        if (err instanceof HttpErrorResponse) {
          errorMsg = err.error?.error || err.error?.message || err.error || err.message;
        }
        updateState(store, '[Attribute] Create Failure', { error: errorMsg, isLoading: false });
        return { success: false, error: errorMsg };
      }
    },

    async update(id: number, body: any): Promise<{ success: boolean; error?: string }> {
      updateState(store, '[Attribute] Update', { isLoading: true, error: null });
      try {
        await firstValueFrom(api.update(id, body));
        updateState(store, '[Attribute] Update Success', { isLoading: false });
        return { success: true };
      } catch (err) {
        let errorMsg = 'Failed to update attribute';
        if (err instanceof HttpErrorResponse) {
          errorMsg = err.error?.error || err.error?.message || err.error || err.message;
        }
        updateState(store, '[Attribute] Update Failure', { error: errorMsg, isLoading: false });
        return { success: false, error: errorMsg };
      }
    },

    async remove(id: number): Promise<{ success: boolean; error?: string }> {
      updateState(store, '[Attribute] Remove', { isLoading: true, error: null });
      try {
        await firstValueFrom(api.remove(id));
        updateState(store, '[Attribute] Remove Success', { isLoading: false });
        return { success: true };
      } catch (err) {
        let errorMsg = 'Failed to delete attribute';
        if (err instanceof HttpErrorResponse) {
          errorMsg = err.error?.error || err.error?.message || err.error || err.message;
        }
        updateState(store, '[Attribute] Remove Failure', { error: errorMsg, isLoading: false });
        return { success: false, error: errorMsg };
      }
    },

    resetCurrent(): void {
      updateState(store, '[Attribute] Reset Current', { currentAttribute: null });
    }
  }))
);
