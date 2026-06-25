import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { CommonModule, DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, HasPermissionDirective, CommonModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent implements OnInit {
  private http = inject(HttpClient);
  private document = inject(DOCUMENT);
  private seoService = inject(SeoService);
  private router = inject(Router);

  siteName = signal<string>('CRETE');
  siteLogo = signal<string>('');
  sidebarOpen = signal<boolean>(true);

  ngOnInit() {
    this.loadAdminSettings();
  }

  loadAdminSettings() {
    this.http.get<any>(`${environment.apiUrl}/public/settings`).subscribe({
      next: (res) => {
        const settings = res.data || res;
        if (settings) {
          if (settings.site_name) {
            this.siteName.set(settings.site_name);
            this.seoService.updateTitle(`Admin Dashboard | ${settings.site_name}`);
          } else {
            this.seoService.updateTitle('Admin Dashboard | CRETE');
          }
          
          if (settings.site_logo) {
            this.siteLogo.set(settings.site_logo);
            this.seoService.updateFavicon(settings.site_logo);
          }

          // Apply admin colors dynamically
          const adminColor = settings.admin_primary_color || '#1e3678';
          this.document.documentElement.style.setProperty('--admin-primary-color', adminColor);
        }
      },
      error: (err) => {
        console.error('Failed to load admin settings', err);
        this.seoService.updateTitle('Admin Dashboard | CRETE');
      }
    });
  }

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  logout() {
    // Clear auth token and redirect to login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
    this.router.navigate(['/admin/login']);
  }
}
