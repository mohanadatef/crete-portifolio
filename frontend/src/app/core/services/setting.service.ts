import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedData, Setting } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class SettingService {
  private http = inject(HttpClient);
  private adminUrl = `${environment.apiUrl}/admin/settings`;
  private publicUrl = `${environment.apiUrl}/public/settings`;

  // Admin Methods
  getAll(params: any = {}): Observable<ApiResponse<PaginatedData<Setting>>> {
    return this.http.get<ApiResponse<PaginatedData<Setting>>>(this.adminUrl, { params });
  }

  getById(id: number): Observable<ApiResponse<Setting>> {
    return this.http.get<ApiResponse<Setting>>(`${this.adminUrl}/${id}`);
  }

  create(data: any): Observable<ApiResponse<Setting>> {
    return this.http.post<ApiResponse<Setting>>(this.adminUrl, data);
  }

  update(id: number, data: any): Observable<ApiResponse<Setting>> {
    return this.http.put<ApiResponse<Setting>>(`${this.adminUrl}/${id}`, data);
  }

  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.adminUrl}/${id}`);
  }

  // Public Methods
  getPublic(params: any = {}): Observable<ApiResponse<PaginatedData<Setting> | Setting[]>> {
    return this.http.get<ApiResponse<PaginatedData<Setting> | Setting[]>>(this.publicUrl, { params });
  }

  getPublicBySlug(slug: string): Observable<ApiResponse<Setting>> {
    return this.http.get<ApiResponse<Setting>>(`${this.publicUrl}/${slug}`);
  }
}
