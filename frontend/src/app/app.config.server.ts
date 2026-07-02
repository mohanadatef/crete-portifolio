import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';
import { TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';

export class TranslateServerLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    try {
      // 1. Try public assets directory in angular build context (relative to workspace root during build/run)
      let assetsPath = path.join(process.cwd(), 'src', 'assets', 'i18n', `${lang}.json`);
      if (!fs.existsSync(assetsPath)) {
        assetsPath = path.join(process.cwd(), 'public', 'assets', 'i18n', `${lang}.json`);
      }
      if (!fs.existsSync(assetsPath)) {
        assetsPath = path.join(process.cwd(), 'assets', 'i18n', `${lang}.json`);
      }
      if (!fs.existsSync(assetsPath)) {
        assetsPath = path.join(process.cwd(), 'dist', 'frontend', 'browser', 'assets', 'i18n', `${lang}.json`);
      }

      if (fs.existsSync(assetsPath)) {
        const fileContent = fs.readFileSync(assetsPath, 'utf8');
        return of(JSON.parse(fileContent));
      } else {
        console.warn(`[TranslateServerLoader] Translation file not found at: ${assetsPath}`);
      }
    } catch (error) {
      console.error(`[TranslateServerLoader] Error reading translation file for ${lang}:`, error);
    }
    return of({});
  }
}

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    {
      provide: TranslateLoader,
      useClass: TranslateServerLoader
    }
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
