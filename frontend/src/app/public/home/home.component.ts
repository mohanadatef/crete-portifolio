import { Component, inject, OnInit, AfterViewInit, signal } from '@angular/core';
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
export class HomeComponent implements OnInit, AfterViewInit {
  private http = inject(HttpClient);
  public translate = inject(TranslateService);
  private seoService = inject(SeoService);
  private settingService = inject(SettingService);
  private pageService = inject(PageService);

  backendUrl = environment.backendUrl;
  projects: any[] = [];
  status: 'loading' | 'success' | 'error' = 'loading';
  homePage = signal<Page | null>(null);

  stats = signal<any[]>([
    { number: 500, current: 0, suffix: '+', label_en: 'Units Delivered', label_ar: 'وحدة تم تسليمها' },
    { number: 15, current: 0, suffix: '+', label_en: 'Elite Projects', label_ar: 'مشروع متميز' },
    { number: 10, current: 0, suffix: '+', label_en: 'Years of Excellence', label_ar: 'سنوات من التميز' },
    { number: 100, current: 0, suffix: '%', label_en: 'Client Satisfaction', label_ar: 'رضا العملاء' }
  ]);

  getPrimaryImagePath(project: any): string | null {
    if (!project.images || project.images.length === 0) return null;
    const primary = project.images.find((img: any) => img.is_primary);
    return primary ? primary.image_path : project.images[0].image_path;
  }

  ngOnInit() {
    const siteName = this.settingService.getSetting('site_name') || 'CRETE Developments';
    this.seoService.updateTitle(`Home | ${siteName}`);

    // Load dynamic company stats if configured
    const statsSetting = this.settingService.getSetting('company_stats');
    if (statsSetting) {
      try {
        const parsed = JSON.parse(statsSetting);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const list = parsed.map(item => ({
            number: parseInt(item.number, 10) || 0,
            current: 0,
            suffix: item.suffix || '',
            label_en: item.label_en || '',
            label_ar: item.label_ar || ''
          }));
          this.stats.set(list);
        }
      } catch (e) {
        console.error('Failed to parse company_stats setting', e);
      }
    }

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

  ngAfterViewInit() {
    if (typeof window !== 'undefined') {
      const statsSection = document.querySelector('#stats-section');
      if (statsSection) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.animateCounters();
              observer.unobserve(statsSection);
            }
          });
        }, { threshold: 0.1 });
        observer.observe(statsSection);
      }
    }
  }

  animateCounters() {
    const list = this.stats();
    list.forEach((stat, idx) => {
      const target = stat.number;
      if (target === 0) {
        stat.current = 0;
        return;
      }
      
      let currentVal = 0;
      const duration = 2000; // 2 seconds animation
      const steps = 50;
      const increment = Math.ceil(target / steps);
      const stepTime = duration / steps;
      
      const timer = setInterval(() => {
        currentVal += increment;
        if (currentVal >= target) {
          stat.current = target;
          clearInterval(timer);
        } else {
          stat.current = currentVal;
        }
      }, stepTime);
    });
  }

  stripHtml(html: string | undefined): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  }
}
