import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { CommonModule, DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, HasPermissionDirective, CommonModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent implements OnInit {
  private http = inject(HttpClient);
  private document = inject(DOCUMENT);

  siteName = signal<string>('CRETE');
  siteLogo = signal<string>('');

  ngOnInit() {
    this.loadAdminSettings();
  }

  loadAdminSettings() {
    this.http.get<any>(`${environment.apiUrl}/public/settings`).subscribe({
      next: (res) => {
        const settings = res.data || res;
        if (settings) {
          if (settings.site_name) this.siteName.set(settings.site_name);
          if (settings.site_logo) this.siteLogo.set(settings.site_logo);

          // Apply admin colors dynamically
          const adminColor = settings.admin_primary_color || '#1e3678';
          this.document.documentElement.style.setProperty('--admin-primary-color', adminColor);
        }
      },
      error: (err) => console.error('Error loading admin settings', err)
    });
  }
}
