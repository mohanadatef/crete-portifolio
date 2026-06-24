import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SettingService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getPublicSettings(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/public/settings`);
  }
}
