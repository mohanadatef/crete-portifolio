import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  // We use the local API URL, fallback to what the other services use or typical default.
  private apiUrl = 'http://backend.test/api/v1';

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/login`, credentials).pipe(
      tap(response => {
        if (response && response.data && response.data.token) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', response.data.token);
            if (response.data.user) {
              localStorage.setItem('auth_user', JSON.stringify(response.data.user));
            }
          }
        }
      })
    );
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
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
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    if (!user || !user.roles) return false;
    return user.roles.some((r: any) => r.name === role);
  }
}
