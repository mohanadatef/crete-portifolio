import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { SeoService } from './services/seo.service';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs/operators';
import { ToastContainerComponent } from './components/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'frontend';
  private seoService = inject(SeoService);
  private router = inject(Router);
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);

  ngOnInit() {
    this.seoService.initSettings();
    
    if (isPlatformBrowser(this.platformId)) {
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe((event: any) => {
        const origin = window.location.origin;
        const currentUrl = `${origin}${event.urlAfterRedirects.split('?')[0]}`;
        this.seoService.updateCanonicalUrl(currentUrl);

        this.seoService.updateHreflang([
          { lang: 'en', url: currentUrl }
        ]);

        // Auto-scroll window to top
        window.scrollTo(0, 0);

        // Auto-scroll scrollable main content panels (like the dashboard scroll area) to top
        setTimeout(() => {
          const scrollables = document.querySelectorAll('.overflow-y-auto, main');
          scrollables.forEach(el => {
            el.scrollTo(0, 0);
          });
        }, 50);
      });
    }
  }
}
