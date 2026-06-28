import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageService } from '../../core/services/page.service';
import { Page } from '../../core/models/models';
import { TranslateService, TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { SeoService } from '../../services/seo.service';
import { SettingService } from '../../services/setting.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { LeadService } from '../../services/lead.service';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, TranslatePipe, TranslateDirective, FormsModule, RouterLink],
  templateUrl: './about.component.html'
})
export class AboutComponent implements OnInit {
  private pageService = inject(PageService);
  translate = inject(TranslateService);
  private seoService = inject(SeoService);
  private settingService = inject(SettingService);
  private http = inject(HttpClient);
  private leadService = inject(LeadService);

  page = signal<Page | null>(null);
  isLoading = true;
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
    const siteName = this.settingService.getSetting('site_name') || 'CRETE Developments';
    this.seoService.updateTitle(`About Us | ${siteName}`);
    this.loadPageContent();
  }

  loadPageContent() {
    this.pageService.getPublicBySlug('about-us').subscribe({
      next: (res) => {
        this.page.set(res.data);
        this.isLoading = false;

        const blocks = this.getBlocks(res.data);
        if (blocks.some((b: any) => b.type === 'projects')) {
          this.loadProjects();
        }
      },
      error: () => {
        this.isLoading = false;
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
      source: 'about-us-block'
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
