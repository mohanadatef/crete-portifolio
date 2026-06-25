import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PageService } from '../../core/services/page.service';
import { Page } from '../../core/models/models';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { SeoService } from '../../services/seo.service';
import { SettingService } from '../../services/setting.service';

@Component({
  selector: 'app-page',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './page.component.html'
})
export class PublicPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private pageService = inject(PageService);
  public translate = inject(TranslateService);
  private seoService = inject(SeoService);
  private settingService = inject(SettingService);

  page = signal<Page | null>(null);
  status = signal<'loading' | 'success' | 'error' | 'not-found'>('loading');

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
}
