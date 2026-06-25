import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageService } from '../../core/services/page.service';
import { Page } from '../../core/models/models';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { SeoService } from '../../services/seo.service';
import { SettingService } from '../../services/setting.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './about.component.html'
})
export class AboutComponent implements OnInit {
  private pageService = inject(PageService);
  translate = inject(TranslateService);
  private seoService = inject(SeoService);
  private settingService = inject(SettingService);

  page = signal<Page | null>(null);
  isLoading = true;

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
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
