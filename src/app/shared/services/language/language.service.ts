import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import localeJa from '@angular/common/locales/ja';
import { Injectable, signal } from '@angular/core';
import { getValue, InterpolationParameters, TranslateService } from '@ngx-translate/core';
import { BrowserStorage } from 'app/shared/utils/browser-storage';
import { NumberUtils } from 'app/shared/utils/number-utils';
import en from 'assets/i18n/en.json';
import { firstValueFrom, Observable, Subject } from 'rxjs';
import {
   AUTOMATIC_NUMBER_FORMAT, DEFAULT_LANGUAGE, Language, LANGUAGE_QUERY_PARAM, languageOf, localeIdOf, NumberFormat,
   numberFormatOf, numberLocaleIdOf
} from './language';

registerLocaleData(localeDe);
registerLocaleData(localeJa);

/**
 * Determines the language of the user interface and switches it at runtime. The language is a matter of presentation only,
 * it never changes data that is persisted (scenes, entries, views). Log level names of the current language are also recognized
 * when log files are imported.
 */
@Injectable({
   providedIn: 'root'
})
export class LanguageService {

   static readonly STORAGE_KEY = 'koia.language';
   static readonly NUMBER_FORMAT_STORAGE_KEY = 'koia.numberFormat';

   private static instance: LanguageService;

   readonly current = signal<Language>(DEFAULT_LANGUAGE);
   readonly numberFormat = signal<NumberFormat>(AUTOMATIC_NUMBER_FORMAT);
   private numberLocale = localeIdOf(DEFAULT_LANGUAGE);

   private readonly changedSubject = new Subject<Language>();

   constructor(private translateService: TranslateService) {
      LanguageService.instance = this;
   }

   /**
    * forgets the current instance, the static methods then use English again until another instance is created (tests only)
    */
   static reset(): void {
      LanguageService.instance = undefined;
   }

   /**
    * translates the specified key in the current language, for code that has no access to dependency injection (e.g. models);
    * English is used when no [[LanguageService]] was created yet
    */
   static instant(key: string, params?: InterpolationParameters): string {
      if (LanguageService.instance) {
         return LanguageService.instance.instant(key, params);
      }
      return interpolate(getValue(en, key) as string ?? key, params);
   }

   /**
    * @returns the locale ID of the current language, used to format dates for display
    */
   static localeId(): string {
      return localeIdOf(LanguageService.language());
   }

   /**
    * @returns the locale used to format and parse numbers (see [[numberLocaleIdOf]]), 'en-US' when no [[LanguageService]] was created yet
    */
   static numberLocaleId(): string {
      return LanguageService.instance?.numberLocaleId() ?? localeIdOf(DEFAULT_LANGUAGE);
   }

   /**
    * @returns the current language, English when no [[LanguageService]] was created yet
    */
   static language(): Language {
      return LanguageService.instance?.current() ?? DEFAULT_LANGUAGE;
   }

   /**
    * emits the current language after the language or the locale of numbers has changed, i.e. whenever texts or numbers are to be
    * shown anew
    */
   get changed$(): Observable<Language> {
      return this.changedSubject.asObservable();
   }

   localeId(): string {
      return localeIdOf(this.current());
   }

   numberLocaleId(): string {
      return this.numberLocale;
   }

   /**
    * @returns the locale in which the specified number format shows numbers in the current language
    */
   localeIdOfNumberFormat(format: NumberFormat): string {
      return numberLocaleIdOf(this.current(), format, this.browserLanguageTags());
   }

   /**
    * switches to the specified number format and remembers it for subsequent visits; notifies [[changed$]] when numbers look different
    */
   useNumberFormat(format: NumberFormat): void {
      BrowserStorage.write(LanguageService.NUMBER_FORMAT_STORAGE_KEY, format, err => console.warn('number format cannot be remembered', err));
      this.numberFormat.set(format);
      const numberLocale = this.localeIdOfNumberFormat(format);
      if (numberLocale !== this.numberLocale) {
         this.numberLocale = numberLocale;
         this.changedSubject.next(this.current());
      }
   }

   instant(key: string, params?: InterpolationParameters): string {
      return this.translateService.instant(key, params) as string;
   }

   /**
    * Determines the initial language from (by priority) the 'lang' query parameter (Koia invoked by Retrospective),
    * the language last selected by the user, the language preferences of the browser, English, and the remembered number format
    * (automatic by default).
    *
    * A language passed as query parameter is remembered as if selected by the user, while the language derived from the browser
    * is not remembered in order to follow later changes of the browser preferences.
    */
   async init(): Promise<void> {
      this.numberFormat.set(numberFormatOf(BrowserStorage.read(LanguageService.NUMBER_FORMAT_STORAGE_KEY)) ?? AUTOMATIC_NUMBER_FORMAT);
      const requested = languageOf(new URLSearchParams(window.location.search).get(LANGUAGE_QUERY_PARAM));
      const language = requested ?? languageOf(this.readStored()) ?? this.browserLanguage() ?? DEFAULT_LANGUAGE;
      await this.apply(language, !!requested);
   }

   /**
    * switches to the specified language and remembers it for subsequent visits
    */
   async use(language: Language): Promise<void> {
      await this.apply(language, true);
   }

   private async apply(language: Language, remember: boolean): Promise<void> {
      try {
         await firstValueFrom(this.translateService.use(language));
      } catch (err) {
         console.warn('translations cannot be loaded for language ' + language, err);
      }
      if (remember) {
         this.store(language);
      }
      document.documentElement.lang = language;
      const changed = this.current() !== language;
      this.numberLocale = numberLocaleIdOf(language, this.numberFormat(), this.browserLanguageTags());
      this.current.set(language);
      if (changed) {
         this.changedSubject.next(language);
      }
   }

   private browserLanguage(): Language | undefined {
      return this.browserLanguageTags().map(languageOf).find(l => !!l);
   }

   private browserLanguageTags(): readonly string[] {
      return navigator.languages?.length ? navigator.languages : [navigator.language];
   }

   private readStored(): string | null {
      return BrowserStorage.read(LanguageService.STORAGE_KEY);
   }

   private store(language: Language): void {
      BrowserStorage.write(LanguageService.STORAGE_KEY, language, err => console.warn('language cannot be remembered', err));
   }
}

/**
 * numbers formatted or parsed without a locale follow the language and number format of the user interface
 */
NumberUtils.defaultLocale = () => LanguageService.numberLocaleId();

function interpolate(text: string, params?: InterpolationParameters): string {
   return params ? text.replace(/{{\s*([\w.]+)\s*}}/g, (match, name) => String(params[name] ?? match)) : text;
}
