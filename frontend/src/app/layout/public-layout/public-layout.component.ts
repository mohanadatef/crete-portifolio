import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateService, TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { DOCUMENT, CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { LayoutService } from '../../services/layout.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, TranslateDirective, CommonModule],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.scss'
})
export class PublicLayoutComponent implements OnInit {
  isMobileMenuOpen = false;
  translate = inject(TranslateService);
  document = inject(DOCUMENT);
  layoutService = inject(LayoutService);
  private http = inject(HttpClient);
  private titleService = inject(Title);

  // Settings properties
  siteName = signal<string>('CRETE');
  siteLogo = signal<string>('');
  showProjects = signal<boolean>(true);
  showBlog = signal<boolean>(true);
  showContact = signal<boolean>(true);
  showAbout = signal<boolean>(true);
  availableLangs = signal<string[]>(['en', 'ar']);

  // Settings-driven visibility flags (loaded from settings API)
  private settingsShowContact = signal<boolean>(true);
  private settingsShowAbout = signal<boolean>(true);

  pages = signal<any[]>([]);
  customPages = computed(() => {
    return this.pages().filter(p => p.slug !== 'about-us' && p.slug !== 'contact-us');
  });

  constructor() {
    this.translate.addLangs(['en', 'ar']);
    let defaultLang = 'en';
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('lang');
      if (savedLang && (savedLang === 'en' || savedLang === 'ar')) {
        defaultLang = savedLang;
      } else {
        const browserLang = this.translate.getBrowserLang();
        defaultLang = browserLang?.match(/en|ar/) ? browserLang : 'en';
      }
    }
    this.setLanguage(defaultLang);
  }

  ngOnInit() {
    this.loadPublicSettings();
    this.loadPublicPages();
  }

  loadPublicSettings() {
    this.http.get<any>(`${environment.apiUrl}/public/settings`).subscribe({
      next: (res) => {
        // public settings endpoint returns the pluck('value', 'key') map directly
        const settings = res.data || res;
        if (settings) {
          if (settings.site_name) {
            this.siteName.set(settings.site_name);
            const seoTitle = settings.seo_title || settings.site_name;
            this.titleService.setTitle(seoTitle);
          }
          if (settings.site_logo) this.siteLogo.set(settings.site_logo);
          
          this.showProjects.set(settings.show_projects == '1');
          this.showBlog.set(settings.show_blog == '1');
          // Store settings-level visibility flags (combined with page existence in loadPublicPages)
          this.settingsShowContact.set(settings.show_contact !== '0');
          this.settingsShowAbout.set(settings.show_about !== '0');

          if (settings.available_languages) {
            const list = settings.available_languages.split(',').filter((l: string) => l);
            if (list.length > 0) {
              this.availableLangs.set(list);
              // If only one language is available, force it
              if (list.length === 1) {
                this.setLanguage(list[0]);
              }
            }
          }

          // Apply website colors dynamically
          const primary = settings.web_primary_color || '#c89f45';
          const secondary = settings.web_secondary_color || '#1e3678';
          this.document.documentElement.style.setProperty('--crete-gold', primary);
          this.document.documentElement.style.setProperty('--crete-blue', secondary);
        }
      },
      error: (err) => console.error('Error loading public settings', err)
    });
  }

  loadPublicPages() {
    this.http.get<any>(`${environment.apiUrl}/public/pages`).subscribe({
      next: (res) => {
        const pages = res.data || res || [];
        if (Array.isArray(pages)) {
          const activePages = pages.filter(p => p.status === true || p.status == 1);
          this.pages.set(activePages);
          
          const hasAbout = activePages.some(p => p.slug === 'about-us');
          const hasContact = activePages.some(p => p.slug === 'contact-us');
          // Show About/Contact only if both: settings allow it AND the page exists in DB
          this.showAbout.set(hasAbout && this.settingsShowAbout());
          this.showContact.set(hasContact && this.settingsShowContact());
        }
      },
      error: (err) => console.error('Error loading public pages', err)
    });
  }

  toggleLanguage() {
    const currentLang = this.translate.currentLang();
    const nextLang = currentLang === 'en' ? 'ar' : 'en';
    
    // Only toggle if the language is available
    if (this.availableLangs().includes(nextLang)) {
      this.setLanguage(nextLang);
    }
  }

  setLanguage(lang: string) {
    this.translate.use(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', lang);
    }
    if (lang === 'ar') {
      this.document.documentElement.dir = 'rtl';
      this.document.documentElement.lang = 'ar';
    } else {
      this.document.documentElement.dir = 'ltr';
      this.document.documentElement.lang = 'en';
    }
  }
}
