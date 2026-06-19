import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedData, BlogCategory } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class BlogCategoryService {
  private http = inject(HttpClient);
  private adminUrl = `${environment.apiUrl}/admin/blog-categories`;
  private publicUrl = `${environment.apiUrl}/public/blog-categories`;

  // Admin Methods
  getAll(params: any = {}): Observable<ApiResponse<PaginatedData<BlogCategory>>> {
    return this.http.get<ApiResponse<PaginatedData<BlogCategory>>>(this.adminUrl, { params });
  }

  getById(id: number): Observable<ApiResponse<BlogCategory>> {
    return this.http.get<ApiResponse<BlogCategory>>(`${this.adminUrl}/${id}`);
  }

  create(data: any): Observable<ApiResponse<BlogCategory>> {
    return this.http.post<ApiResponse<BlogCategory>>(this.adminUrl, data);
  }

  update(id: number, data: any): Observable<ApiResponse<BlogCategory>> {
    return this.http.put<ApiResponse<BlogCategory>>(`${this.adminUrl}/${id}`, data);
  }

  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.adminUrl}/${id}`);
  }

  // Public Methods
  getPublic(params: any = {}): Observable<ApiResponse<PaginatedData<BlogCategory> | BlogCategory[]>> {
    return this.http.get<ApiResponse<PaginatedData<BlogCategory> | BlogCategory[]>>(this.publicUrl, { params });
  }

  getPublicBySlug(slug: string): Observable<ApiResponse<BlogCategory>> {
    return this.http.get<ApiResponse<BlogCategory>>(`${this.publicUrl}/${slug}`);
  }
}
