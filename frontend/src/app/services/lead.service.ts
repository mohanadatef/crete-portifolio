import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LeadService {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:8000/api/v1';

  submitLead(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/public/leads`, data);
  }
}
