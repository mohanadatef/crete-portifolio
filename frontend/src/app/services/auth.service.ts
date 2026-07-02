import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  // We use the central API URL from environment configuration.
  private apiUrl = environment.apiUrl;

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/login`, credentials).pipe(
      tap(response => {
        if (response) {
          let data = response.data;
          // Handle potential double data wrapping by Laravel JsonResource
          if (data && data.data) {
            data = data.data;
          }
          
          if (data) {
            if (typeof window !== 'undefined') {
              if (data.user) {
                localStorage.setItem('auth_user', JSON.stringify(data.user));
              }
              if (data.token) {
                localStorage.setItem('auth_token', data.token);
              }
            }
          }
        }
      })
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/forgot-password`, { email });
  }

  resetPassword(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/reset-password`, payload);
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  isLoggedIn(): boolean {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('auth_user');
    }
    return false;
  }

  getCurrentUser(): any {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('auth_user');
      if (userStr) {
        return JSON.parse(userStr);
      }
    }
    return null;
  }

  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (user.roles && user.roles.some((r: any) => r.name === 'admin')) {
      return true;
    }
    if (!user.permissions) return false;
    return user.permissions.includes(permission);
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    if (!user || !user.roles) return false;
    return user.roles.some((r: any) => r.name === role);
  }
}
