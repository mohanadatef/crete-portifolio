import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:8000/api/v1/admin/settings';
  
  settings = {
    seo_title: '',
    google_tag: ''
  };

  status: 'idle' | 'loading' | 'success' | 'error' = 'idle';

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    // Note: To fetch auth token, we would typically have an interceptor. 
    // Assuming token is sent via interceptor. For simplicity, we just call the endpoint.
    this.http.get<any[]>(this.apiUrl, {
        headers: { Authorization: `Bearer ${(typeof window !== 'undefined' ? localStorage.getItem('token') : null)}` }
    }).subscribe({
      next: (data) => {
        data.forEach(item => {
          if (item.key === 'seo_title') this.settings.seo_title = item.value || '';
          if (item.key === 'google_tag') this.settings.google_tag = item.value || '';
        });
      }
    });
  }

  saveSettings() {
    this.status = 'loading';
    this.http.post(`${this.apiUrl}/bulk`, this.settings, {
        headers: { Authorization: `Bearer ${(typeof window !== 'undefined' ? localStorage.getItem('token') : null)}` }
    }).subscribe({
      next: () => {
        this.status = 'success';
        setTimeout(() => this.status = 'idle', 3000);
      },
      error: () => this.status = 'error'
    });
  }
}
