import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LeadService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  submitLead(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/public/leads`, data);
  }
}
