import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedData, Project } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private http = inject(HttpClient);
  private adminUrl = `${environment.apiUrl}/admin/projects`;
  private publicUrl = `${environment.apiUrl}/public/projects`;

  // Admin Methods
  getAll(params: any = {}): Observable<ApiResponse<PaginatedData<Project>>> {
    return this.http.get<ApiResponse<PaginatedData<Project>>>(this.adminUrl, { params });
  }

  getById(id: number): Observable<ApiResponse<Project>> {
    return this.http.get<ApiResponse<Project>>(`${this.adminUrl}/${id}`);
  }

  create(data: any): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>(this.adminUrl, data);
  }

  update(id: number, data: any): Observable<ApiResponse<Project>> {
    return this.http.put<ApiResponse<Project>>(`${this.adminUrl}/${id}`, data);
  }

  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.adminUrl}/${id}`);
  }

  // Public Methods
  getPublic(params: any = {}): Observable<ApiResponse<PaginatedData<Project> | Project[]>> {
    return this.http.get<ApiResponse<PaginatedData<Project> | Project[]>>(this.publicUrl, { params });
  }

  getPublicBySlug(slug: string): Observable<ApiResponse<Project>> {
    return this.http.get<ApiResponse<Project>>(`${this.publicUrl}/${slug}`);
  }
}
