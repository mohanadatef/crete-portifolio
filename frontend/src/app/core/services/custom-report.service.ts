import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class CustomReportService {
  private http = inject(HttpClient);
  private adminUrl = `${environment.apiUrl}/admin/custom-reports`;

  getAll(params: any = {}): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(this.adminUrl, { params });
  }

  getById(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.adminUrl}/${id}`);
  }

  create(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.adminUrl, data);
  }

  update(id: number, data: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.adminUrl}/${id}`, data);
  }

  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.adminUrl}/${id}`);
  }

  run(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.adminUrl}/${id}/run`);
  }

  exportCsv(id: number): Observable<Blob> {
    return this.http.get(`${this.adminUrl}/${id}/export`, { responseType: 'blob' });
  }
}
