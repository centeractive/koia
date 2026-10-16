import { Injectable } from '@angular/core';
import { TranslateLoader, TranslationObject } from '@ngx-translate/core';
import { from, Observable } from 'rxjs';
import { DEFAULT_LANGUAGE, Language, languageOf } from './language';

const TRANSLATIONS: Readonly<Record<Language, () => Promise<{ default: TranslationObject }>>> = {
   en: () => import('assets/i18n/en.json'),
   de: () => import('assets/i18n/de.json'),
   ja: () => import('assets/i18n/ja.json')
};

/**
 * loads the translations bundled with the application as lazy chunks, they are content hashed and need no base URL
 */
@Injectable()
export class BundledTranslateLoader implements TranslateLoader {

   getTranslation(lang: string): Observable<TranslationObject> {
      const load = TRANSLATIONS[languageOf(lang) ?? DEFAULT_LANGUAGE];
      return from(load().then(m => m.default));
   }
}
