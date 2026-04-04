import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { ApiSuccess, ReportMeta, ReportingPageData } from './reporting.models';

export interface ReportFilterParams {
  fromDate?: string;
  toDate?: string;
  customerId?: number;
  productId?: number;
  planId?: number;
  subscriptionStatus?: string;
  invoiceStatus?: string;
  paymentStatus?: string;
  billingPeriod?: string;
}

@Injectable({ providedIn: 'root' })
export class ReportingApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/internal/reports';

  private buildParams(f: ReportFilterParams): HttpParams {
    let p = new HttpParams();
    if (f.fromDate) p = p.set('fromDate', f.fromDate);
    if (f.toDate) p = p.set('toDate', f.toDate);
    if (f.customerId != null) p = p.set('customerId', String(f.customerId));
    if (f.productId != null) p = p.set('productId', String(f.productId));
    if (f.planId != null) p = p.set('planId', String(f.planId));
    if (f.subscriptionStatus) p = p.set('subscriptionStatus', f.subscriptionStatus);
    if (f.invoiceStatus) p = p.set('invoiceStatus', f.invoiceStatus);
    if (f.paymentStatus) p = p.set('paymentStatus', f.paymentStatus);
    if (f.billingPeriod) p = p.set('billingPeriod', f.billingPeriod);
    return p;
  }

  page(f: ReportFilterParams): Observable<ApiSuccess<ReportingPageData>> {
    return this.http.get<ApiSuccess<ReportingPageData>>(`${this.base}/page`, { params: this.buildParams(f) });
  }

  meta(): Observable<ApiSuccess<ReportMeta>> {
    return this.http.get<ApiSuccess<ReportMeta>>(`${this.base}/meta`);
  }

  exportCsv(type: 'revenue' | 'revenue_table' | 'payments' | 'subscriptions' | 'invoices', f: ReportFilterParams): Observable<string> {
    let p = this.buildParams(f).set('type', type).set('format', 'csv');
    return this.http.get(`${this.base}/export`, { params: p, responseType: 'text' });
  }
}
