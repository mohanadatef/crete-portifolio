import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedData, BlogPost } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class BlogPostService {
  private http = inject(HttpClient);
  private adminUrl = `${environment.apiUrl}/admin/blog-posts`;
  private publicUrl = `${environment.apiUrl}/public/blog-posts`;

  // Admin Methods
  getAll(params: any = {}): Observable<ApiResponse<PaginatedData<BlogPost>>> {
    return this.http.get<ApiResponse<PaginatedData<BlogPost>>>(this.adminUrl, { params });
  }

  getById(id: number): Observable<ApiResponse<BlogPost>> {
    return this.http.get<ApiResponse<BlogPost>>(`${this.adminUrl}/${id}`);
  }

  create(data: any): Observable<ApiResponse<BlogPost>> {
    return this.http.post<ApiResponse<BlogPost>>(this.adminUrl, data);
  }

  update(id: number, data: any): Observable<ApiResponse<BlogPost>> {
    return this.http.put<ApiResponse<BlogPost>>(`${this.adminUrl}/${id}`, data);
  }

  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.adminUrl}/${id}`);
  }

  // Public Methods
  getPublic(params: any = {}): Observable<ApiResponse<PaginatedData<BlogPost> | BlogPost[]>> {
    return this.http.get<ApiResponse<PaginatedData<BlogPost> | BlogPost[]>>(this.publicUrl, { params });
  }

  getPublicBySlug(slug: string): Observable<ApiResponse<BlogPost>> {
    return this.http.get<ApiResponse<BlogPost>>(`${this.publicUrl}/${slug}`);
  }
}
