import { ApplicationConfig, provideZoneChangeDetection, Injectable } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class CustomTranslateLoader implements TranslateLoader {
  constructor(private http: HttpClient) {}
  getTranslation(lang: string): Observable<any> {
    return this.http.get(`./assets/i18n/${lang}.json`);
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideHttpClient(),
    provideTranslateService({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useClass: CustomTranslateLoader,
        deps: [HttpClient]
      }
    } as any), provideClientHydration()
  ]
};
