import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

export type ApiSuccess<T> = { success: true; message: string; data: T };

@Injectable({ providedIn: 'root' })
export class AttributeApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/internal/attributes';

  list(): Observable<ApiSuccess<any[]>> {
    return this.http.get<ApiSuccess<any[]>>(this.base);
  }

  get(attributeId: number): Observable<ApiSuccess<any>> {
    return this.http.get<ApiSuccess<any>>(`${this.base}/${attributeId}`);
  }

  create(body: Record<string, unknown>): Observable<ApiSuccess<any>> {
    return this.http.post<ApiSuccess<any>>(this.base, body);
  }

  update(attributeId: number, body: Record<string, unknown>): Observable<ApiSuccess<any>> {
    return this.http.patch<ApiSuccess<any>>(`${this.base}/${attributeId}`, body);
  }

  remove(attributeId: number): Observable<ApiSuccess<any>> {
    return this.http.delete<ApiSuccess<any>>(`${this.base}/${attributeId}`);
  }
}
