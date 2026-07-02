import { Component, inject, OnInit, AfterViewInit, OnDestroy, signal } from '@angular/core';
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
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private http = inject(HttpClient);
  public translate = inject(TranslateService);
  private seoService = inject(SeoService);
  private settingService = inject(SettingService);
  private pageService = inject(PageService);

  backendUrl = environment.backendUrl;
  allProjects: any[] = [];
  filteredProjects: any[] = [];
  locations: Array<{ en: string, ar: string }> = [];
  selectedLocation = signal<string>('All');
  status: 'loading' | 'success' | 'error' = 'loading';
  homePage = signal<Page | null>(null);
  hasIntersected = false;
  private counterTimers: any[] = [];

  stats = signal<any[]>([]);

  heroTitleEn = signal<string>('Crete Developments');
  heroTitleAr = signal<string>('كريت للتطوير العقاري');
  heroSubtitleEn = signal<string>('');
  heroSubtitleAr = signal<string>('');
  heroBg = signal<string>('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=90');
  siteName = signal<string>('Crete Developments');

  isHeroBgVideo(): boolean {
    const bg = this.heroBg();
    if (!bg) return false;
    const lower = bg.toLowerCase();
    return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.ogg') || lower.includes('/video/');
  }

  getProjectImageUrl(project: any): string {
    if (!project.images || project.images.length === 0) {
      return 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&q=80';
    }
    const path = this.getPrimaryImagePath(project);
    if (!path) {
      return 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&q=80';
    }
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return this.backendUrl + path;
  }

  legacyTitleEn = signal<string>('');
  legacyTitleAr = signal<string>('');
  legacyDescEn = signal<string>('');
  legacyDescAr = signal<string>('');

  partners = signal<any[]>([]);

  constructionUpdates = signal<any[]>([]);

  getPrimaryImagePath(project: any): string | null {
    if (!project.images || project.images.length === 0) return null;
    const primary = project.images.find((img: any) => img.is_primary);
    return primary ? primary.image_path : project.images[0].image_path;
  }

  selectLocation(loc: string) {
    this.selectedLocation.set(loc);
    if (loc === 'All') {
      this.filteredProjects = this.allProjects;
    } else {
      this.filteredProjects = this.allProjects.filter((p: any) => p.location === loc);
    }
    this.setupScrollReveal();
  }

  ngOnInit() {
    this.settingService.getPublicSettings().subscribe(settings => {
      const data = settings?.data || settings;
      if (data) {
        const siteName = data['site_name'] || 'CRETE Developments';
        this.siteName.set(siteName);
        this.seoService.updateTitle(`Home | ${siteName}`);

        // Load custom homepage contents from settings
        this.heroTitleEn.set(data['home_hero_title_en'] || 'Crete Developments');
        this.heroTitleAr.set(data['home_hero_title_ar'] || 'كريت للتطوير العقاري');
        this.heroSubtitleEn.set(data['home_hero_subtitle_en'] || '');
        this.heroSubtitleAr.set(data['home_hero_subtitle_ar'] || '');
        this.heroBg.set(data['home_hero_bg'] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=90');

        this.legacyTitleEn.set(data['home_legacy_title_en'] || '');
        this.legacyTitleAr.set(data['home_legacy_title_ar'] || '');
        this.legacyDescEn.set(data['home_legacy_desc_en'] || '');
        this.legacyDescAr.set(data['home_legacy_desc_ar'] || '');

        if (data['home_partners']) {
          try {
            const parsed = Array.isArray(data['home_partners']) ? data['home_partners'] : JSON.parse(data['home_partners']);
            if (Array.isArray(parsed) && parsed.length > 0) {
              this.partners.set(parsed);
            }
          } catch (e) {
            console.error('Failed to parse home_partners', e);
          }
        }

        if (data['home_construction_updates']) {
          try {
            const parsed = Array.isArray(data['home_construction_updates']) ? data['home_construction_updates'] : JSON.parse(data['home_construction_updates']);
            if (Array.isArray(parsed) && parsed.length > 0) {
              this.constructionUpdates.set(parsed);
            }
          } catch (e) {
            console.error('Failed to parse home_construction_updates', e);
          }
        }

        // Load dynamic company stats if configured
        const statsSetting = data['company_stats'];
        if (statsSetting) {
          try {
            const parsed = Array.isArray(statsSetting) ? statsSetting : JSON.parse(statsSetting);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const list = parsed.map(item => ({
                number: parseInt(item.number, 10) || 0,
                current: 0,
                suffix: item.suffix || '',
                label_en: item.label_en || '',
                label_ar: item.label_ar || ''
              }));
              this.stats.set(list);
              // Trigger immediately if viewport intersection already occurred
              if (this.hasIntersected) {
                this.animateCounters();
              }
            }
          } catch (e) {
            console.error('Failed to parse company_stats setting', e);
          }
        }
        this.setupScrollReveal();
      }
    });

    // Load custom home page content if it exists and is active
    this.pageService.getPublicBySlug('home').subscribe({
      next: (res) => {
        if (res && res.data) {
          const p = res.data;
          this.homePage.set(p);
          
          // Use page title for SEO
          const title = this.translate.currentLang() === 'ar' ? p.title_ar : p.title_en;
          const siteName = this.settingService.getSetting('site_name') || 'CRETE Developments';
          this.seoService.updateTitle(`${title} | ${siteName}`);
          
          const content = this.translate.currentLang() === 'ar' ? p.content_ar : p.content_en;
          if (content) {
            this.seoService.updateMeta('description', this.stripHtml(content).substring(0, 160));
          }
        }
      },
      error: (err) => {
        console.log('No custom home page override active, using default template.');
      }
    });

    this.http.get<any>(`${environment.apiUrl}/public/projects`, { params: { per_page: '100' } }).subscribe({
      next: (response) => {
        // Handle paginated response structure from Laravel Resource collection
        const paginatedData = response.data || {};
        const projectsArray = paginatedData.data || response || [];
        
        this.allProjects = Array.isArray(projectsArray) ? projectsArray : [];
        
        // Extract unique locations
        const locMap = new Map<string, string>();
        this.allProjects.forEach((p: any) => {
          const locEn = p.location || '';
          const locAr = p.location_ar || p.location || '';
          if (locEn) {
            locMap.set(locEn, locAr);
          }
        });
        
        this.locations = Array.from(locMap.entries()).map(([en, ar]) => ({ en, ar }));
        
        // Default: display all projects
        this.filteredProjects = this.allProjects;
        this.status = 'success';
        this.setupScrollReveal();
      },
      error: () => this.status = 'error'
    });
  }

  scrollObserver: IntersectionObserver | null = null;

  setupScrollReveal() {
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        const scrollElements = document.querySelectorAll('.reveal-on-scroll');
        
        if (this.scrollObserver) {
          this.scrollObserver.disconnect();
        }

        this.scrollObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              this.scrollObserver?.unobserve(entry.target);
            }
          });
        }, { threshold: 0.01, rootMargin: '0px 0px -20px 0px' });
        
        scrollElements.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            el.classList.add('is-visible');
          } else {
            this.scrollObserver?.observe(el);
          }
        });
      }, 200);
    }
  }

  ngAfterViewInit() {
    if (typeof window !== 'undefined') {
      // 1. Stats Counter Animation Observer
      const statsSection = document.querySelector('#stats-section');
      if (statsSection) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.hasIntersected = true;
              this.animateCounters();
              observer.unobserve(statsSection);
            }
          });
        }, { threshold: 0.1 });
        observer.observe(statsSection);
      }

      // 2. Scroll-driven Animations Observer
      this.setupScrollReveal();
    }
  }

  animateCounters() {
    const list = [...this.stats()];
    list.forEach((stat, idx) => {
      const target = stat.number;
      if (target === 0) {
        return;
      }
      
      let currentVal = 0;
      const duration = 2000; // 2 seconds animation
      const steps = 60;
      const increment = Math.ceil(target / steps);
      const stepTime = duration / steps;
      
      const timer = setInterval(() => {
        currentVal += increment;
        if (currentVal >= target) {
          list[idx] = { ...list[idx], current: target };
          this.stats.set([...list]);
          clearInterval(timer);
        } else {
          list[idx] = { ...list[idx], current: currentVal };
          this.stats.set([...list]);
        }
      }, stepTime);
      this.counterTimers.push(timer);
    });
  }

  ngOnDestroy() {
    this.counterTimers.forEach(t => clearInterval(t));
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
    }
  }

  stripHtml(html: string | undefined): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  }
}
