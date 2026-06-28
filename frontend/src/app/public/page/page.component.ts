import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PageService } from '../../core/services/page.service';
import { Page } from '../../core/models/models';
import { TranslateService, TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { SeoService } from '../../services/seo.service';
import { SettingService } from '../../services/setting.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { LeadService } from '../../services/lead.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-page',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe, TranslateDirective, FormsModule],
  templateUrl: './page.component.html'
})
export class PublicPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private pageService = inject(PageService);
  public translate = inject(TranslateService);
  private seoService = inject(SeoService);
  private settingService = inject(SettingService);
  private http = inject(HttpClient);
  private leadService = inject(LeadService);

  page = signal<Page | null>(null);
  status = signal<'loading' | 'success' | 'error' | 'not-found'>('loading');
  projects = signal<any[]>([]);

  // Contact block fields
  contactFormData = {
    name: '',
    email: '',
    phone: '',
    message: ''
  };
  contactStatus: 'idle' | 'loading' | 'success' | 'error' = 'idle';
  consentGiven = false;

  getMeta(page: Page | null, key: string, defaultValue: any): any {
    if (!page || !page.meta_fields) return defaultValue;
    const val = page.meta_fields[key];
    return val !== undefined && val !== null ? val : defaultValue;
  }

  getLayout(page: Page | null): string {
    return this.getMeta(page, 'layout', 'default');
  }

  shouldShowTitle(page: Page | null): boolean {
    return this.getMeta(page, 'show_title', true);
  }

  getPaddingClass(page: Page | null): string {
    const pad = this.getMeta(page, 'padding', 'medium');
    if (pad === 'small') return 'py-8';
    if (pad === 'large') return 'py-24';
    return 'py-16';
  }

  getBgColor(page: Page | null): string {
    return this.getMeta(page, 'bg_color', '#ffffff');
  }

  getEditorMode(page: Page | null): string {
    return this.getMeta(page, 'editor_mode', 'standard');
  }

  getBlocks(page: Page | null): any[] {
    return this.getMeta(page, 'blocks', []);
  }

  getPrimaryImagePath(project: any): string | null {
    if (!project.images || project.images.length === 0) return null;
    const primary = project.images.find((img: any) => img.is_primary);
    return primary ? primary.image_path : project.images[0].image_path;
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.loadPage(slug);
      } else {
        this.status.set('error');
      }
    });
  }

  loadPage(slug: string) {
    this.status.set('loading');
    this.pageService.getPublicBySlug(slug).subscribe({
      next: (res) => {
        if (res && res.data) {
          const p = res.data;
          this.page.set(p);
          this.status.set('success');

          // Set Page Title
          const siteName = this.settingService.getSetting('site_name') || 'CRETE Developments';
          const title = this.translate.currentLang() === 'ar' ? p.title_ar : p.title_en;
          this.seoService.updateTitle(`${title} | ${siteName}`);

          // Fetch projects if projects block exists
          const blocks = this.getBlocks(p);
          if (blocks.some((b: any) => b.type === 'projects')) {
            this.loadProjects();
          }
        } else {
          this.status.set('not-found');
        }
      },
      error: (err) => {
        console.error('Error loading dynamic page:', err);
        if (err.status === 404) {
          this.status.set('not-found');
        } else {
          this.status.set('error');
        }
      }
    });
  }

  loadProjects() {
    this.http.get<any>(`${environment.apiUrl}/public/projects`).subscribe({
      next: (response) => {
        const paginatedData = response.data || {};
        const projectsArray = paginatedData.data || response || [];
        this.projects.set(Array.isArray(projectsArray) ? projectsArray : []);
      },
      error: (err) => console.error('Error loading projects block data:', err)
    });
  }

  onContactSubmit() {
    this.contactStatus = 'loading';
    const payload = {
      ...this.contactFormData,
      source: this.page()?.slug || 'block-builder-page'
    };

    this.leadService.submitLead(payload).subscribe({
      next: () => {
        this.contactStatus = 'success';
        this.contactFormData = { name: '', email: '', phone: '', message: '' };
        this.consentGiven = false;
      },
      error: () => {
        this.contactStatus = 'error';
      }
    });
  }
}
