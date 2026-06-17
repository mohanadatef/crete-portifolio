import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { SeoService } from './services/seo.service';
import { DOCUMENT } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'frontend';
  private seoService = inject(SeoService);
  private router = inject(Router);
  private document = inject(DOCUMENT);

  ngOnInit() {
    this.seoService.initSettings();
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Calculate full URL
      const currentUrl = `https://crete-developments.com${event.urlAfterRedirects.split('?')[0]}`;
      this.seoService.updateCanonicalUrl(currentUrl);

      // Set AR/EN hreflang alternatives assuming default path structure
      this.seoService.updateHreflang([
        { lang: 'en', url: currentUrl },
        { lang: 'ar', url: `https://crete-developments.com/ar${event.urlAfterRedirects.split('?')[0]}` }
      ]);
    });
  }
}
