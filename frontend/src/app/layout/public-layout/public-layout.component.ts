import { Component, inject, OnInit, signal, computed, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateService, TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { DOCUMENT, CommonModule, isPlatformBrowser } from '@angular/common';
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
  private platformId = inject(PLATFORM_ID);

  // Settings properties
  siteName = signal<string>('CRETE');
  siteLogo = signal<string>('');
  showProjects = signal<boolean>(true);
  showBlog = signal<boolean>(true);
  showContact = signal<boolean>(true);
  showAbout = signal<boolean>(true);
  availableLangs = signal<string[]>(['en', 'ar']);
  companyBranches = signal<any[]>([]);

  socialLinks = signal<any[]>([]);
  isChatWidgetExpanded = false;
  
  chatLinks = computed(() => this.socialLinks().filter(link => link.show_in_chat && link.url));
  footerLinks = computed(() => this.socialLinks().filter(link => link.show_in_footer && link.url));

  // Settings-driven visibility flags (loaded from settings API) - No longer needed, links are active if page exists
  pages = signal<any[]>([]);

  getMeta(page: any, key: string, defaultValue: any): any {
    if (!page || !page.meta_fields) return defaultValue;
    const val = page.meta_fields[key];
    return val !== undefined && val !== null ? val : defaultValue;
  }

  navbarPages = computed(() => {
    return this.pages().filter(p => p.slug !== 'home' && p.slug !== 'about-us' && p.slug !== 'contact-us' && this.getMeta(p, 'show_in_navbar', true));
  });

  footerPages = computed(() => {
    return this.pages().filter(p => p.slug !== 'home' && p.slug !== 'about-us' && p.slug !== 'contact-us' && this.getMeta(p, 'show_in_footer', true));
  });

  constructor() {
    this.translate.addLangs(['en', 'ar']);
    let defaultLang = 'en';
    if (isPlatformBrowser(this.platformId)) {
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
          if (settings.company_branches) {
            try {
              const list = JSON.parse(settings.company_branches);
              if (Array.isArray(list) && list.length > 0) {
                this.companyBranches.set(list);
              }
            } catch (e) {
              console.error('Error parsing company_branches', e);
            }
          }

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
          if (isPlatformBrowser(this.platformId)) {
            this.document.documentElement.style.setProperty('--crete-gold', primary);
            this.document.documentElement.style.setProperty('--crete-blue', secondary);
          }

          if (settings.social_links) {
            try {
              this.socialLinks.set(JSON.parse(settings.social_links));
            } catch (e) {
              console.error('Error parsing social_links', e);
              this.socialLinks.set([]);
            }
          } else {
            this.socialLinks.set([]);
          }
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
          // Show About/Contact if the page exists in DB
          this.showAbout.set(hasAbout);
          this.showContact.set(hasContact);
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
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('lang', lang);
      this.document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      this.document.documentElement.lang = lang;
    }
  }

  toggleChatWidget() {
    const activeChatLinks = this.chatLinks();
    if (activeChatLinks.length === 1) {
      if (isPlatformBrowser(this.platformId)) {
        window.open(activeChatLinks[0].url, '_blank', 'noopener,noreferrer');
      }
    } else {
      this.isChatWidgetExpanded = !this.isChatWidgetExpanded;
    }
  }

  getSocialColorClass(icon: string): string {
    switch (icon.toLowerCase()) {
      case 'whatsapp':
        return 'bg-[#25D366] hover:bg-[#20ba59] text-white hover:shadow-green-500/30';
      case 'facebook':
        return 'bg-[#1877F2] hover:bg-[#166fe5] text-white hover:shadow-blue-600/30';
      case 'instagram':
        return 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white hover:shadow-pink-500/30';
      case 'telegram':
        return 'bg-[#26A5E4] hover:bg-[#2294cd] text-white hover:shadow-sky-400/30';
      case 'linkedin':
        return 'bg-[#0A66C2] hover:bg-[#095baf] text-white hover:shadow-blue-700/30';
      case 'youtube':
        return 'bg-[#FF0000] hover:bg-[#cc0000] text-white hover:shadow-red-600/30';
      case 'twitter':
      case 'x':
        return 'bg-[#000000] hover:bg-[#222222] text-white hover:shadow-black/30';
      case 'tiktok':
        return 'bg-[#010101] hover:bg-[#222222] text-white hover:shadow-black/30';
      case 'phone':
        return 'bg-[#10B981] hover:bg-[#059669] text-white hover:shadow-emerald-500/30';
      case 'email':
        return 'bg-[#EF4444] hover:bg-[#DC2626] text-white hover:shadow-red-500/30';
      default:
        return 'bg-crete-gold hover:bg-yellow-500 text-white hover:shadow-amber-500/30';
    }
  }

  getSocialLabel(icon: string): string {
    switch (icon.toLowerCase()) {
      case 'whatsapp': return 'WhatsApp';
      case 'facebook': return 'Facebook';
      case 'instagram': return 'Instagram';
      case 'telegram': return 'Telegram';
      case 'linkedin': return 'LinkedIn';
      case 'youtube': return 'YouTube';
      case 'twitter': return 'X (Twitter)';
      case 'x': return 'X';
      case 'tiktok': return 'TikTok';
      case 'phone': return this.translate.currentLang() === 'ar' ? 'اتصل بنا' : 'Call Us';
      case 'email': return this.translate.currentLang() === 'ar' ? 'راسلنا عبر البريد' : 'Email Us';
      default: return icon.toUpperCase();
    }
  }
}
