import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { PaymentTermListResponse, PaymentTermPageData } from './payment-term.models';

export type ApiSuccess<T> = { success: true; message: string; data: T };

@Injectable({ providedIn: 'root' })
export class PaymentTermApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/internal/config/payment-terms';

  list(page = 1, limit = 100, search?: string, status?: string): Observable<ApiSuccess<PaymentTermListResponse>> {
    let params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    if (search?.trim()) params = params.set('search', search.trim());
    if (status) params = params.set('status', status);
    return this.http.get<ApiSuccess<PaymentTermListResponse>>(this.base, { params });
  }

  get(paymentTermId: number): Observable<ApiSuccess<PaymentTermPageData>> {
    return this.http.get<ApiSuccess<PaymentTermPageData>>(`${this.base}/${paymentTermId}`);
  }

  create(body: Record<string, unknown>): Observable<ApiSuccess<PaymentTermPageData>> {
    return this.http.post<ApiSuccess<PaymentTermPageData>>(this.base, body);
  }

  update(paymentTermId: number, body: Record<string, unknown>): Observable<ApiSuccess<PaymentTermPageData>> {
    return this.http.patch<ApiSuccess<PaymentTermPageData>>(`${this.base}/${paymentTermId}`, body);
  }

  remove(paymentTermId: number): Observable<ApiSuccess<{ paymentTermId: number; deleted: boolean }>> {
    return this.http.delete<ApiSuccess<{ paymentTermId: number; deleted: boolean }>>(`${this.base}/${paymentTermId}`);
  }

  deleteInstallment(installmentId: number): Observable<ApiSuccess<{ installmentId: number; deleted: boolean }>> {
    return this.http.delete<ApiSuccess<{ installmentId: number; deleted: boolean }>>(
      `${this.base}/installments/${installmentId}`
    );
  }

  deleteMethod(methodId: number): Observable<ApiSuccess<{ paymentTermMethodId: number; deleted: boolean }>> {
    return this.http.delete<ApiSuccess<{ paymentTermMethodId: number; deleted: boolean }>>(
      `${this.base}/methods/${methodId}`
    );
  }
}
