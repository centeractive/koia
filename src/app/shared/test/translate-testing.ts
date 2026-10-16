import { Provider, EnvironmentProviders } from '@angular/core';
import { provideTranslateLoader, provideTranslateService, TranslateLoader, TranslationObject } from '@ngx-translate/core';
import de from 'assets/i18n/de.json';
import en from 'assets/i18n/en.json';
import ja from 'assets/i18n/ja.json';
import { Observable, of } from 'rxjs';

const TRANSLATIONS: Record<string, TranslationObject> = { en, de, ja };

/**
 * loads the translations synchronously, so that texts are translated in the first change detection cycle
 */
export class SyncTranslateLoader implements TranslateLoader {

   getTranslation(lang: string): Observable<TranslationObject> {
      return of(TRANSLATIONS[lang] ?? en);
   }
}

/**
 * provides the translation services with English as current language
 */
export function provideTranslateTesting(): (Provider | EnvironmentProviders)[] {
   return provideTranslateService({
      lang: 'en',
      fallbackLang: 'en',
      loader: provideTranslateLoader(SyncTranslateLoader)
   });
}
