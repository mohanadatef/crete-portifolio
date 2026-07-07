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

        // Apply primary, secondary, and background colors dynamically in browser
        if (typeof window !== 'undefined') {
          if (data['web_primary_color']) {
            document.documentElement.style.setProperty('--crete-gold', data['web_primary_color']);
          }
          if (data['web_secondary_color']) {
            document.documentElement.style.setProperty('--crete-blue', data['web_secondary_color']);
          }
          if (data['web_dark_bg_color']) {
            document.documentElement.style.setProperty('--crete-navy', data['web_dark_bg_color']);
          }
          if (data['web_light_bg_color']) {
            document.documentElement.style.setProperty('--crete-cream', data['web_light_bg_color']);
          }
        }

        // Apply fonts dynamically
        this.applyFonts(data);
      }
    });
  }

  loadGoogleFont(fontFamily: string) {
    if (!fontFamily || typeof window === 'undefined') return;
    const formattedFont = fontFamily.replace(/\s+/g, '+');
    const linkId = `google-font-${formattedFont.toLowerCase()}`;
    
    // Check if already injected
    if (this.document.getElementById(linkId)) return;

    const link = this.document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${formattedFont}:wght@300;400;500;600;700;800&display=swap`;
    this.document.head.appendChild(link);
  }

  loadCustomFont(fontFamily: string, fileUrl: string) {
    if (!fontFamily || !fileUrl || typeof window === 'undefined') return;
    const styleId = `custom-font-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
    
    // Check if already injected
    if (this.document.getElementById(styleId)) return;

    const style = this.document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @font-face {
        font-family: '${fontFamily}';
        src: url('${fileUrl}');
        font-display: swap;
      }
    `;
    this.document.head.appendChild(style);
  }

  applyFonts(data: any) {
    if (typeof window === 'undefined') return;

    // 1. Handle Body Font
    const bodyType = data['font_body_type'] || 'google';
    const bodyFamily = data['font_body_family'] || 'Inter';
    const bodyCustomFile = data['font_body_custom_file'] || '';

    if (bodyType === 'google') {
      this.loadGoogleFont(bodyFamily);
      document.documentElement.style.setProperty('--font-family-body', `'${bodyFamily}', system-ui, -apple-system, sans-serif`);
    } else if (bodyType === 'custom' && bodyCustomFile) {
      const familyName = data['font_body_custom_name'] || bodyFamily || 'CustomBodyFont';
      this.loadCustomFont(familyName, bodyCustomFile);
      document.documentElement.style.setProperty('--font-family-body', `'${familyName}', sans-serif`);
    } else {
      document.documentElement.style.setProperty('--font-family-body', `'Inter', system-ui, -apple-system, sans-serif`);
    }

    // 2. Handle Headings Font
    const headingsType = data['font_headings_type'] || 'google';
    const headingsFamily = data['font_headings_family'] || 'Playfair Display';
    const headingsCustomFile = data['font_headings_custom_file'] || '';

    if (headingsType === 'google') {
      this.loadGoogleFont(headingsFamily);
      document.documentElement.style.setProperty('--font-family-headings', `'${headingsFamily}', Georgia, serif`);
    } else if (headingsType === 'custom' && headingsCustomFile) {
      const familyName = data['font_headings_custom_name'] || headingsFamily || 'CustomHeadingsFont';
      this.loadCustomFont(familyName, headingsCustomFile);
      document.documentElement.style.setProperty('--font-family-headings', `'${familyName}', serif`);
    } else {
      document.documentElement.style.setProperty('--font-family-headings', `'Playfair Display', Georgia, serif`);
    }
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
