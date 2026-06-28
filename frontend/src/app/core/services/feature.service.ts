import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedData, Feature } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class FeatureService {
  private http = inject(HttpClient);
  private adminUrl = `${environment.apiUrl}/admin/features`;
  private publicUrl = `${environment.apiUrl}/public/features`;

  // Admin Methods
  getAll(params: any = {}): Observable<ApiResponse<PaginatedData<Feature>>> {
    return this.http.get<ApiResponse<PaginatedData<Feature>>>(this.adminUrl, { params });
  }

  getActive(): Observable<ApiResponse<Feature[]>> {
    return this.http.get<ApiResponse<Feature[]>>(`${this.adminUrl}/active`);
  }

  getById(id: number): Observable<ApiResponse<Feature>> {
    return this.http.get<ApiResponse<Feature>>(`${this.adminUrl}/${id}`);
  }

  create(data: any): Observable<ApiResponse<Feature>> {
    return this.http.post<ApiResponse<Feature>>(this.adminUrl, data);
  }

  update(id: number, data: any): Observable<ApiResponse<Feature>> {
    return this.http.put<ApiResponse<Feature>>(`${this.adminUrl}/${id}`, data);
  }

  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.adminUrl}/${id}`);
  }

  // Public Methods
  getPublic(params: any = {}): Observable<ApiResponse<PaginatedData<Feature> | Feature[]>> {
    return this.http.get<ApiResponse<PaginatedData<Feature> | Feature[]>>(this.publicUrl, { params });
  }

  getPublicBySlug(slug: string): Observable<ApiResponse<Feature>> {
    return this.http.get<ApiResponse<Feature>>(`${this.publicUrl}/${slug}`);
  }
}
