import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

export type ApiSuccess<T> = { success: true; message: string; data: T };

export interface OrderListItem {
  order_number: string;
  subscription_id: number;
  status: string;
  plan_name: string | null;
  billing_period: string | null;
  total_amount: number;
  start_date: string;
  created_at: string;
}

export interface OrderListData {
  orders: OrderListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OrderItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  amount: number;
  variant_id: number | null;
}

export interface OrderInvoice {
  invoice_id: number;
  invoice_number: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
}

export interface OrderPayment {
  payment_id: number;
  payment_method: string;
  amount: number;
  payment_status: string;
  payment_date: string;
}

export interface OrderDetail {
  order_number: string;
  subscription_id: number;
  subscription_number: string;
  status: string;
  plan_id: number;
  plan_name: string | null;
  billing_period: string | null;
  plan_price: number | null;
  start_date: string;
  expiration_date: string;
  customer_name: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  items: OrderItem[];
  address: null;
  invoice: OrderInvoice | null;
  payment: OrderPayment | null;
}

export interface InvoiceListData {
  order_number: string;
  invoices: OrderInvoice[];
}

export interface OrderListQuery {
  page?: number;
  limit?: number;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class OrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/external/orders';

  list(query: OrderListQuery = {}): Observable<ApiSuccess<OrderListData>> {
    let params = new HttpParams();
    if (query.page !== undefined) params = params.set('page', query.page);
    if (query.limit !== undefined) params = params.set('limit', query.limit);
    if (query.status) params = params.set('status', query.status);
    return this.http.get<ApiSuccess<OrderListData>>(this.base, { params });
  }

  detail(orderNumber: string): Observable<ApiSuccess<OrderDetail>> {
    return this.http.get<ApiSuccess<OrderDetail>>(`${this.base}/${orderNumber}`);
  }

  invoicesForOrder(orderNumber: string): Observable<ApiSuccess<InvoiceListData>> {
    return this.http.get<ApiSuccess<InvoiceListData>>(`${this.base}/${orderNumber}/invoices`);
  }

  download(orderNumber: string): Observable<ApiSuccess<OrderDetail & { download: boolean }>> {
    return this.http.get<ApiSuccess<OrderDetail & { download: boolean }>>(`${this.base}/${orderNumber}/download`);
  }

  renew(orderNumber: string): Observable<ApiSuccess<any>> {
    return this.http.post<ApiSuccess<any>>(`${this.base}/${orderNumber}/renew`, {});
  }

  close(orderNumber: string): Observable<ApiSuccess<{ closed: boolean; order_number: string }>> {
    return this.http.post<ApiSuccess<{ closed: boolean; order_number: string }>>(`${this.base}/${orderNumber}/close`, {});
  }

  pay(orderNumber: string, paymentMethod: string): Observable<ApiSuccess<any>> {
    return this.http.post<ApiSuccess<any>>(`${this.base}/${orderNumber}/payment`, { paymentMethod });
  }
}
