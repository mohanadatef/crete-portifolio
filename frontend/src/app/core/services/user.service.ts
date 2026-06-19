import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedData, User } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private adminUrl = `${environment.apiUrl}/admin/users`;
  private publicUrl = `${environment.apiUrl}/public/users`;

  // Admin Methods
  getAll(params: any = {}): Observable<ApiResponse<PaginatedData<User>>> {
    return this.http.get<ApiResponse<PaginatedData<User>>>(this.adminUrl, { params });
  }

  getById(id: number): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.adminUrl}/${id}`);
  }

  create(data: any): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(this.adminUrl, data);
  }

  update(id: number, data: any): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.adminUrl}/${id}`, data);
  }

  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.adminUrl}/${id}`);
  }

  
}
