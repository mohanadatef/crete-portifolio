import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SettingService {
  private http = inject(HttpClient);
  private apiUrl = 'http://backend.test/api/v1';

  getPublicSettings(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/public/settings`);
  }
}
