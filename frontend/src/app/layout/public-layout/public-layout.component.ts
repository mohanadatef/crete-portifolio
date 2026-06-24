import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { TranslateService, TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { DOCUMENT, CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { LayoutService } from '../../services/layout.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, TranslatePipe, TranslateDirective, CommonModule],
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

  constructor() {
    this.translate.addLangs(['en', 'ar']);
    const browserLang = this.translate.getBrowserLang();
    const defaultLang = browserLang?.match(/en|ar/) ? browserLang : 'en';
    this.setLanguage(defaultLang);
  }

  ngOnInit() {
    this.loadPublicSettings();
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
          
          this.showProjects.set(settings.show_projects !== '0');
          this.showBlog.set(settings.show_blog !== '0');
          this.showContact.set(settings.show_contact !== '0');
          this.showAbout.set(settings.show_about !== '0');

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
    if (lang === 'ar') {
      this.document.documentElement.dir = 'rtl';
      this.document.documentElement.lang = 'ar';
    } else {
      this.document.documentElement.dir = 'ltr';
      this.document.documentElement.lang = 'en';
    }
  }
}
