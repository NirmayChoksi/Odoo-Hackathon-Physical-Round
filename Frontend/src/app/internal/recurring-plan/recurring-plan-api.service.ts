import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

export type ApiSuccess<T> = { success: true; message: string; data: T };

@Injectable({ providedIn: 'root' })
export class RecurringPlanApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/internal/recurring-plans';

  list(page = 1, limit = 100, search?: string, status?: string): Observable<ApiSuccess<any>> {
    let params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    if (search?.trim()) params = params.set('search', search.trim());
    if (status) params = params.set('status', status);
    return this.http.get<ApiSuccess<any>>(this.base, { params });
  }

  get(planId: number): Observable<ApiSuccess<any>> {
    return this.http.get<ApiSuccess<any>>(`${this.base}/${planId}`);
  }

  create(body: Record<string, unknown>): Observable<ApiSuccess<any>> {
    return this.http.post<ApiSuccess<any>>(this.base, body);
  }

  update(planId: number, body: Record<string, unknown>): Observable<ApiSuccess<any>> {
    return this.http.patch<ApiSuccess<any>>(`${this.base}/${planId}`, body);
  }

  remove(planId: number): Observable<ApiSuccess<any>> {
    return this.http.delete<ApiSuccess<any>>(`${this.base}/${planId}`);
  }
}
