import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { TranslateService, TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { DOCUMENT, CommonModule } from '@angular/common';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, TranslatePipe, TranslateDirective, CommonModule],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.scss'
})
export class PublicLayoutComponent {
  isMobileMenuOpen = false;
  translate = inject(TranslateService);
  document = inject(DOCUMENT);

  constructor() {
    this.translate.addLangs(['en', 'ar']);
    const browserLang = this.translate.getBrowserLang();
    const defaultLang = browserLang?.match(/en|ar/) ? browserLang : 'en';
    this.setLanguage(defaultLang);
  }

  toggleLanguage() {
    const currentLang = this.translate.currentLang();
    const nextLang = currentLang === 'en' ? 'ar' : 'en';
    this.setLanguage(nextLang);
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
