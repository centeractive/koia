import { inject, provideAppInitializer, Provider, EnvironmentProviders } from '@angular/core';
import { provideTranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { BundledTranslateLoader } from './bundled-translate-loader';
import { DEFAULT_LANGUAGE } from './language';
import { LanguageService } from './language.service';

/**
 * provides the translation services and determines the initial language before the application starts
 */
export function provideTranslation(): (Provider | EnvironmentProviders)[] {
   return [
      provideTranslateService({
         fallbackLang: DEFAULT_LANGUAGE,
         loader: provideTranslateLoader(BundledTranslateLoader)
      }),
      provideAppInitializer(() => inject(LanguageService).init()
         .catch(err => console.warn('language cannot be initialized', err)))
   ];
}
