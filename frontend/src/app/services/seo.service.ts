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
      const data = settings?.data || settings;
      if (data) {
        // Set Default SEO Title
        const title = data['seo_title'] || data['site_name'] || 'CRETE Developments';
        this.titleService.setTitle(title);
        
        // Update Favicon
        if (data['site_logo']) {
          this.updateFavicon(data['site_logo']);
        }
        
        // Inject Google Tag
        if (data['google_tag']) {
          this.injectGoogleTag(data['google_tag']);
        }
      }
    });
  }

  updateFavicon(url: string) {
    if (!url || typeof window === 'undefined') return;
    let link: HTMLLinkElement | null = this.document.querySelector("link[rel*='icon']");
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'icon');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
    if (url.endsWith('.svg')) {
      link.setAttribute('type', 'image/svg+xml');
    } else if (url.endsWith('.png')) {
      link.setAttribute('type', 'image/png');
    } else if (url.endsWith('.ico')) {
      link.setAttribute('type', 'image/x-icon');
    } else if (url.endsWith('.webp')) {
      link.setAttribute('type', 'image/webp');
    } else {
      link.removeAttribute('type');
    }
  }

  injectGoogleTag(googleTag: string) {
    if (!googleTag || typeof window === 'undefined') return;
    
    // Check if already injected
    if (this.document.getElementById('google-tag-injected')) return;

    const head = this.document.getElementsByTagName('head')[0];
    const id = this.extractGoogleTagId(googleTag);
    if (id) {
      const script1 = this.document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
      script1.id = 'google-tag-injected';
      head.appendChild(script1);
      
      const script2 = this.document.createElement('script');
      script2.text = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${id}');
      `;
      head.appendChild(script2);
    } else {
      console.warn('Unsafe or invalid Google Tag omitted. Only valid GTM-XXXX or G-XXXX container IDs or standard script blocks are allowed.');
    }
  }

  private extractGoogleTagId(tag: string): string | null {
    const trimmed = tag.trim();
    if (/^(G|GTM)-[A-Z0-9]+$/i.test(trimmed)) {
      return trimmed.toUpperCase();
    }
    const gtmMatch = trimmed.match(/id=(GTM-[A-Z0-9]+)/i);
    if (gtmMatch) return gtmMatch[1].toUpperCase();

    const gMatch = trimmed.match(/id=(G-[A-Z0-9]+)/i);
    if (gMatch) return gMatch[1].toUpperCase();

    const configMatch = trimmed.match(/gtag\(['"]config['"]\s*,\s*['"](G-[A-Z0-9]+)['"]\)/i);
    if (configMatch) return configMatch[1].toUpperCase();

    return null;
  }

  updateTitle(title: string) {
    this.titleService.setTitle(title);
    this.metaService.updateTag({ property: 'og:title', content: title });
  }

  updateMeta(name: string, content: string) {
    this.metaService.updateTag({ name, content });
    if (name === 'description') {
      this.metaService.updateTag({ property: 'og:description', content });
    }
  }

  updateOgImage(imageUrl: string) {
    this.metaService.updateTag({ property: 'og:image', content: imageUrl });
  }

  updateOgUrl(url: string) {
    this.metaService.updateTag({ property: 'og:url', content: url });
    this.updateCanonicalUrl(url);
  }

  updateCanonicalUrl(url: string) {
    let link: HTMLLinkElement | null = this.document.querySelector("link[rel='canonical']");
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  updateHreflang(languages: { lang: string, url: string }[]) {
    languages.forEach(l => {
      let link: HTMLLinkElement | null = this.document.querySelector(`link[rel='alternate'][hreflang='${l.lang}']`);
      if (!link) {
        link = this.document.createElement('link');
        link.setAttribute('rel', 'alternate');
        link.setAttribute('hreflang', l.lang);
        this.document.head.appendChild(link);
      }
      link.setAttribute('href', l.url);
    });
  }
}
