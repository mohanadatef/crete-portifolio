import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { SettingService } from './setting.service';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private settingService = inject(SettingService);
  private document = inject(DOCUMENT);

  initSettings() {
    this.settingService.getPublicSettings().subscribe(settings => {
      // Set Default SEO Title
      if (settings['seo_title']) {
        this.titleService.setTitle(settings['seo_title']);
      }
      
      // Inject Google Tag Dynamic Script
      if (settings['google_tag']) {
        const head = this.document.getElementsByTagName('head')[0];
        // We parse the string to inject it. A safer way for GTM is creating a script element.
        // But since the admin provides raw HTML/script string:
        const range = this.document.createRange();
        range.selectNode(head);
        const documentFragment = range.createContextualFragment(settings['google_tag']);
        head.appendChild(documentFragment);
      }
    });
  }

  updateTitle(title: string) {
    this.titleService.setTitle(title);
  }

  updateMeta(name: string, content: string) {
    this.metaService.updateTag({ name, content });
  }
}
