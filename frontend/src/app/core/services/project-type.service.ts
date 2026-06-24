import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedData, ProjectType } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ProjectTypeService {
  private http = inject(HttpClient);
  private adminUrl = `${environment.apiUrl}/admin/project-types`;
  private publicUrl = `${environment.apiUrl}/public/project-types`;

  // Admin Methods
  getAll(params: any = {}): Observable<ApiResponse<PaginatedData<ProjectType>>> {
    return this.http.get<ApiResponse<PaginatedData<ProjectType>>>(this.adminUrl, { params });
  }

  getActive(): Observable<ApiResponse<ProjectType[]>> {
    return this.http.get<ApiResponse<ProjectType[]>>(`${this.adminUrl}/active`);
  }

  getById(id: number): Observable<ApiResponse<ProjectType>> {
    return this.http.get<ApiResponse<ProjectType>>(`${this.adminUrl}/${id}`);
  }

  create(data: any): Observable<ApiResponse<ProjectType>> {
    return this.http.post<ApiResponse<ProjectType>>(this.adminUrl, data);
  }

  update(id: number, data: any): Observable<ApiResponse<ProjectType>> {
    return this.http.put<ApiResponse<ProjectType>>(`${this.adminUrl}/${id}`, data);
  }

  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.adminUrl}/${id}`);
  }

  // Public Methods
  getPublic(params: any = {}): Observable<ApiResponse<PaginatedData<ProjectType> | ProjectType[]>> {
    return this.http.get<ApiResponse<PaginatedData<ProjectType> | ProjectType[]>>(this.publicUrl, { params });
  }

  getPublicBySlug(slug: string): Observable<ApiResponse<ProjectType>> {
    return this.http.get<ApiResponse<ProjectType>>(`${this.publicUrl}/${slug}`);
  }
}
