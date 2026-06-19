import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedData, LandingPage } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class LandingPageService {
  private http = inject(HttpClient);
  private adminUrl = `${environment.apiUrl}/admin/landing-pages`;
  private publicUrl = `${environment.apiUrl}/public/landing-pages`;

  // Admin Methods
  getAll(params: any = {}): Observable<ApiResponse<PaginatedData<LandingPage>>> {
    return this.http.get<ApiResponse<PaginatedData<LandingPage>>>(this.adminUrl, { params });
  }

  getById(id: number): Observable<ApiResponse<LandingPage>> {
    return this.http.get<ApiResponse<LandingPage>>(`${this.adminUrl}/${id}`);
  }

  create(data: any): Observable<ApiResponse<LandingPage>> {
    return this.http.post<ApiResponse<LandingPage>>(this.adminUrl, data);
  }

  update(id: number, data: any): Observable<ApiResponse<LandingPage>> {
    return this.http.put<ApiResponse<LandingPage>>(`${this.adminUrl}/${id}`, data);
  }

  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.adminUrl}/${id}`);
  }

  // Public Methods
  getPublic(params: any = {}): Observable<ApiResponse<PaginatedData<LandingPage> | LandingPage[]>> {
    return this.http.get<ApiResponse<PaginatedData<LandingPage> | LandingPage[]>>(this.publicUrl, { params });
  }

  getPublicBySlug(slug: string): Observable<ApiResponse<LandingPage>> {
    return this.http.get<ApiResponse<LandingPage>>(`${this.publicUrl}/${slug}`);
  }
}
