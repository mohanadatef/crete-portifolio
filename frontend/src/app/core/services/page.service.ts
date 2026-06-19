import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedData, Page } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class PageService {
  private http = inject(HttpClient);
  private adminUrl = `${environment.apiUrl}/admin/pages`;
  private publicUrl = `${environment.apiUrl}/public/pages`;

  // Admin Methods
  getAll(params: any = {}): Observable<ApiResponse<PaginatedData<Page>>> {
    return this.http.get<ApiResponse<PaginatedData<Page>>>(this.adminUrl, { params });
  }

  getById(id: number): Observable<ApiResponse<Page>> {
    return this.http.get<ApiResponse<Page>>(`${this.adminUrl}/${id}`);
  }

  create(data: any): Observable<ApiResponse<Page>> {
    return this.http.post<ApiResponse<Page>>(this.adminUrl, data);
  }

  update(id: number, data: any): Observable<ApiResponse<Page>> {
    return this.http.put<ApiResponse<Page>>(`${this.adminUrl}/${id}`, data);
  }

  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.adminUrl}/${id}`);
  }

  // Public Methods
  getPublic(params: any = {}): Observable<ApiResponse<PaginatedData<Page> | Page[]>> {
    return this.http.get<ApiResponse<PaginatedData<Page> | Page[]>>(this.publicUrl, { params });
  }

  getPublicBySlug(slug: string): Observable<ApiResponse<Page>> {
    return this.http.get<ApiResponse<Page>>(`${this.publicUrl}/${slug}`);
  }
}
