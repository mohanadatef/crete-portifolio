import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';
import { SeoService } from '../../services/seo.service';
import { SettingService } from '../../services/setting.service';
import { PageService } from '../../core/services/page.service';
import { Page } from '../../core/models/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, TranslatePipe, TranslateDirective],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private http = inject(HttpClient);
  public translate = inject(TranslateService);
  private seoService = inject(SeoService);
  private settingService = inject(SettingService);
  private pageService = inject(PageService);

  backendUrl = environment.backendUrl;
  projects: any[] = [];
  status: 'loading' | 'success' | 'error' = 'loading';
  homePage = signal<Page | null>(null);

  getPrimaryImagePath(project: any): string | null {
    if (!project.images || project.images.length === 0) return null;
    const primary = project.images.find((img: any) => img.is_primary);
    return primary ? primary.image_path : project.images[0].image_path;
  }

  ngOnInit() {
    const siteName = this.settingService.getSetting('site_name') || 'CRETE Developments';
    this.seoService.updateTitle(`Home | ${siteName}`);

    // Load custom home page content if it exists and is active
    this.pageService.getPublicBySlug('home').subscribe({
      next: (res) => {
        if (res && res.data) {
          const p = res.data;
          this.homePage.set(p);
          
          // Use page title for SEO
          const title = this.translate.currentLang() === 'ar' ? p.title_ar : p.title_en;
          this.seoService.updateTitle(`${title} | ${siteName}`);
        }
      },
      error: (err) => {
        console.log('No custom home page override active, using default template.');
      }
    });

    this.http.get<any>(`${environment.apiUrl}/public/projects`).subscribe({
      next: (response) => {
        // Handle paginated response structure from Laravel Resource collection
        const paginatedData = response.data || {};
        const projectsArray = paginatedData.data || response || [];
        
        this.projects = Array.isArray(projectsArray) ? projectsArray.slice(0, 3) : [];
        this.status = 'success';
      },
      error: () => this.status = 'error'
    });
  }

  stripHtml(html: string | undefined): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  }
}
