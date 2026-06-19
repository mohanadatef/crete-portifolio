import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedData, Lead } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class LeadService {
  private http = inject(HttpClient);
  private adminUrl = `${environment.apiUrl}/admin/leads`;
  private publicUrl = `${environment.apiUrl}/public/leads`;

  // Admin Methods
  getAll(params: any = {}): Observable<ApiResponse<PaginatedData<Lead>>> {
    return this.http.get<ApiResponse<PaginatedData<Lead>>>(this.adminUrl, { params });
  }

  getById(id: number): Observable<ApiResponse<Lead>> {
    return this.http.get<ApiResponse<Lead>>(`${this.adminUrl}/${id}`);
  }

  create(data: any): Observable<ApiResponse<Lead>> {
    return this.http.post<ApiResponse<Lead>>(this.adminUrl, data);
  }

  update(id: number, data: any): Observable<ApiResponse<Lead>> {
    return this.http.put<ApiResponse<Lead>>(`${this.adminUrl}/${id}`, data);
  }

  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.adminUrl}/${id}`);
  }

  // Public Methods
  getPublic(params: any = {}): Observable<ApiResponse<PaginatedData<Lead> | Lead[]>> {
    return this.http.get<ApiResponse<PaginatedData<Lead> | Lead[]>>(this.publicUrl, { params });
  }

  getPublicBySlug(slug: string): Observable<ApiResponse<Lead>> {
    return this.http.get<ApiResponse<Lead>>(`${this.publicUrl}/${slug}`);
  }
}
