import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedData, Role } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private http = inject(HttpClient);
  private adminUrl = `${environment.apiUrl}/admin/roles`;
  private publicUrl = `${environment.apiUrl}/public/roles`;

  // Admin Methods
  getAll(params: any = {}): Observable<ApiResponse<PaginatedData<Role>>> {
    return this.http.get<ApiResponse<PaginatedData<Role>>>(this.adminUrl, { params });
  }

  getById(id: number): Observable<ApiResponse<Role>> {
    return this.http.get<ApiResponse<Role>>(`${this.adminUrl}/${id}`);
  }

  create(data: any): Observable<ApiResponse<Role>> {
    return this.http.post<ApiResponse<Role>>(this.adminUrl, data);
  }

  update(id: number, data: any): Observable<ApiResponse<Role>> {
    return this.http.put<ApiResponse<Role>>(`${this.adminUrl}/${id}`, data);
  }

  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.adminUrl}/${id}`);
  }

  getPermissions(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.adminUrl}/permissions`);
  }
}
