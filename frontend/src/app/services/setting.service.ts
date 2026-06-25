import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SettingService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  settingsSignal = signal<any>(null);

  getPublicSettings(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/public/settings`).pipe(
      tap(settings => {
        const data = settings?.data || settings;
        this.settingsSignal.set(data);
      })
    );
  }

  getSetting(key: string): string {
    const s = this.settingsSignal();
    return s ? s[key] : '';
  }
}
