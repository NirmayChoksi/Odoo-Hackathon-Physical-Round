import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

export type ApiSuccess<T> = { success: true; message: string; data: T };

export interface CheckoutAddress {
  address_id: number;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export interface SaveAddressBody {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface PlaceOrderResult {
  order_number: string;
  subscription_id: number;
  total_amount: number;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class CheckoutApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/external/checkout';

  /** GET /summary — cart summary (items + totals) */
  summary(): Observable<ApiSuccess<any>> {
    return this.http.get<ApiSuccess<any>>(`${this.base}/summary`);
  }

  /** GET /addresses */
  listAddresses(): Observable<ApiSuccess<{ addresses: CheckoutAddress[] }>> {
    return this.http.get<ApiSuccess<{ addresses: CheckoutAddress[] }>>(`${this.base}/addresses`);
  }

  /** POST /addresses */
  saveAddress(body: SaveAddressBody): Observable<ApiSuccess<{ address_id: number }>> {
    return this.http.post<ApiSuccess<{ address_id: number }>>(`${this.base}/addresses`, body);
  }

  /** PATCH /addresses/:addressId */
  patchAddress(addressId: number, body: Partial<SaveAddressBody> & { isDefault?: boolean }): Observable<ApiSuccess<any>> {
    return this.http.patch<ApiSuccess<any>>(`${this.base}/addresses/${addressId}`, body);
  }

  /** POST /select-address */
  selectAddress(addressId: number): Observable<ApiSuccess<{ address_id: number; selected: boolean }>> {
    return this.http.post<ApiSuccess<{ address_id: number; selected: boolean }>>(`${this.base}/select-address`, { addressId });
  }

  /** POST /payment-method */
  savePaymentMethod(paymentMethod: string): Observable<ApiSuccess<{ payment_method: string }>> {
    return this.http.post<ApiSuccess<{ payment_method: string }>>(`${this.base}/payment-method`, { paymentMethod });
  }

  /** POST /place-order */
  placeOrder(body: { addressId?: number; paymentMethod?: string }): Observable<ApiSuccess<PlaceOrderResult>> {
    return this.http.post<ApiSuccess<PlaceOrderResult>>(`${this.base}/place-order`, body);
  }
}
