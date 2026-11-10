import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { NumberUtils } from 'app/shared/utils/number-utils';
import { throwError } from 'rxjs';
import { LanguageService } from './language.service';

describe('LanguageService', () => {

   const initialUrl = window.location.href;
   let service: LanguageService;
   let browserLanguages: string[];

   function setUrlQuery(query: string): void {
      history.replaceState(null, '', window.location.pathname + query);
   }

   function stored(): string | null {
      return localStorage.getItem(LanguageService.STORAGE_KEY);
   }

   beforeEach(() => {
      localStorage.removeItem(LanguageService.STORAGE_KEY);
      localStorage.removeItem(LanguageService.NUMBER_FORMAT_STORAGE_KEY);
      browserLanguages = ['en-US'];
      vi.spyOn(navigator, 'languages', 'get').mockImplementation(() => browserLanguages);
      service = TestBed.inject(LanguageService);
   });

   afterEach(() => {
      history.replaceState(null, '', initialUrl);
      localStorage.removeItem(LanguageService.STORAGE_KEY);
      localStorage.removeItem(LanguageService.NUMBER_FORMAT_STORAGE_KEY);
      document.documentElement.lang = 'en';
   });

   it('#init should use language of query parameter and remember it', async () => {

      // given
      setUrlQuery('?scene_id=1&lang=ja');
      localStorage.setItem(LanguageService.STORAGE_KEY, 'de');

      // when
      await service.init();

      // then
      expect(service.current()).toBe('ja');
      expect(stored()).toBe('ja');
      expect(document.documentElement.lang).toBe('ja');
      expect(TestBed.inject(TranslateService).getCurrentLang()).toBe('ja');
   });

   it('#init should use remembered language when query parameter is not supported', async () => {

      // given
      setUrlQuery('?lang=fr');
      localStorage.setItem(LanguageService.STORAGE_KEY, 'de');

      // when
      await service.init();

      // then
      expect(service.current()).toBe('de');
   });

   it('#init should use first supported browser language without remembering it', async () => {

      // given
      browserLanguages = ['fr-CH', 'de-CH', 'ja'];

      // when
      await service.init();

      // then
      expect(service.current()).toBe('de');
      expect(stored()).toBeNull();
   });

   it('#init should use English when no language is supported', async () => {

      // given
      browserLanguages = ['fr-CH', 'it'];

      // when
      await service.init();

      // then
      expect(service.current()).toBe('en');
      expect(service.localeId()).toBe('en-US');
      expect(service.numberLocaleId()).toBe('en-US');
   });

   it('#init should use browser language when local storage is not accessible', async () => {

      // given
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
      browserLanguages = ['ja-JP'];

      // when
      await service.init();

      // then
      expect(service.current()).toBe('ja');
   });

   it('#use should switch language, remember it and notify', async () => {

      // given
      await service.init();
      const changes: string[] = [];
      service.changed$.subscribe(l => changes.push(l));

      // when
      await service.use('de');

      // then
      expect(service.current()).toBe('de');
      expect(service.localeId()).toBe('de');
      expect(LanguageService.localeId()).toBe('de');
      expect(LanguageService.language()).toBe('de');
      expect(stored()).toBe('de');
      expect(changes).toEqual(['de']);
      expect(service.instant('language.select')).toBe('Sprache');
      expect(LanguageService.instant('language.select')).toBe('Sprache');
   });

   it('#use should not notify when language does not change', async () => {

      // given
      await service.init();
      const changes: string[] = [];
      service.changed$.subscribe(l => changes.push(l));

      // when
      await service.use('en');

      // then
      expect(changes).toEqual([]);
   });

   it('#use should switch language although it cannot be remembered', async () => {

      // given
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
      const warn = vi.spyOn(console, 'warn').mockReturnValue(undefined);

      // when
      await service.use('ja');

      // then
      expect(service.current()).toBe('ja');
      expect(warn).toHaveBeenCalledWith('language cannot be remembered', expect.any(Error));
   });

   it('#use should switch language although translations cannot be loaded', async () => {

      // given
      vi.spyOn(TestBed.inject(TranslateService), 'use').mockReturnValue(throwError(() => new Error('offline')));
      const warn = vi.spyOn(console, 'warn').mockReturnValue(undefined);

      // when
      await service.use('de');

      // then
      expect(service.current()).toBe('de');
      expect(warn).toHaveBeenCalled();
   });

   it('#init should use navigator language when browser provides no language preferences', async () => {

      // given
      browserLanguages = [];
      vi.spyOn(navigator, 'language', 'get').mockReturnValue('ja-JP');

      // when
      await service.init();

      // then
      expect(service.current()).toBe('ja');
   });

   it('#instant should translate in English without params when no instance exists', () => {

      // given
      LanguageService.reset();

      // when
      const text = LanguageService.instant('language.select');

      // then
      expect(text).toBe('Language');
   });

   it('#language should be English when no instance exists', () => {

      // given
      LanguageService.reset();

      // when
      const language = LanguageService.language();

      // then
      expect(language).toBe('en');
   });

   it('#instant should keep placeholders when no instance exists and params are empty', () => {

      // given
      LanguageService.reset();

      // when
      const text = LanguageService.instant('scene.aborting', {});

      // then
      expect(text).toBe('{{message}} aborting...');
   });

   it('#init should format numbers in regional variant of browser language', async () => {

      // given
      browserLanguages = ['fr-CH', 'de', 'de-CH'];

      // when
      await service.init();

      // then
      expect(service.current()).toBe('de');
      expect(service.localeId()).toBe('de');
      expect(service.numberLocaleId()).toBe('de-CH');
      expect(LanguageService.numberLocaleId()).toBe('de-CH');
      expect(NumberUtils.defaultLocale()).toBe('de-CH');
      expect(service.numberFormat()).toBe('auto');
   });

   it('#init should format numbers in regional variant matching language of query parameter', async () => {

      // given
      setUrlQuery('?lang=en');
      browserLanguages = ['de-CH', 'en-GB'];

      // when
      await service.init();

      // then
      expect(service.numberLocaleId()).toBe('en-GB');
   });

   it('#use should format numbers in regional variant matching new language', async () => {

      // given
      browserLanguages = ['de-CH', 'en-GB'];
      await service.init();

      // when
      await service.use('en');

      // then
      expect(service.numberLocaleId()).toBe('en-GB');
      expect(service.localeId()).toBe('en-US');
   });

   it('#use should format numbers in locale of language when browser has no regional variant of it', async () => {

      // given
      browserLanguages = ['de-CH'];

      // when
      await service.use('ja');

      // then
      expect(service.numberLocaleId()).toBe('ja');
   });

   it('#init should skip malformed browser language tags for numbers', async () => {

      // given
      browserLanguages = ['de-', 'de_CH', 'de-AT-u-nu-arab'];

      // when
      await service.init();

      // then
      expect(service.current()).toBe('de');
      expect(service.numberLocaleId()).toBe('de-AT');
   });

   it('#numberLocaleId should be English (United States) when no instance exists', () => {

      // given
      LanguageService.reset();

      // when
      const locale = LanguageService.numberLocaleId();

      // then
      expect(locale).toBe('en-US');
   });

   it('#init should format numbers in remembered number format', async () => {

      // given
      localStorage.setItem(LanguageService.NUMBER_FORMAT_STORAGE_KEY, 'fr-FR');
      browserLanguages = ['de-CH'];

      // when
      await service.init();

      // then
      expect(service.numberFormat()).toBe('fr-FR');
      expect(service.numberLocaleId()).toBe('fr-FR');
   });

   it('#init should use automatic number format when remembered one is not supported', async () => {

      // given
      localStorage.setItem(LanguageService.NUMBER_FORMAT_STORAGE_KEY, 'xx');
      browserLanguages = ['de-CH'];

      // when
      await service.init();

      // then
      expect(service.numberFormat()).toBe('auto');
      expect(service.numberLocaleId()).toBe('de-CH');
   });

   it('#useNumberFormat should format numbers in chosen format, remember it and notify', async () => {

      // given
      await service.init();
      const emitted: string[] = [];
      service.changed$.subscribe(l => emitted.push(l));

      // when
      service.useNumberFormat('de-CH');

      // then
      expect(service.numberLocaleId()).toBe('de-CH');
      expect(localStorage.getItem(LanguageService.NUMBER_FORMAT_STORAGE_KEY)).toBe('de-CH');
      expect(emitted).toEqual(['en']);
      expect(NumberUtils.thousandsSeparator(undefined)).toBe('\'');
   });

   it('#useNumberFormat should not notify when numbers keep their format', async () => {

      // given
      await service.init();
      const emitted: string[] = [];
      service.changed$.subscribe(l => emitted.push(l));

      // when
      service.useNumberFormat('en-US');

      // then
      expect(emitted).toEqual([]);
      expect(localStorage.getItem(LanguageService.NUMBER_FORMAT_STORAGE_KEY)).toBe('en-US');
   });

   it('#useNumberFormat should return to automatic format', async () => {

      // given
      browserLanguages = ['de-CH'];
      await service.init();
      const emitted: string[] = [];
      service.changed$.subscribe(l => emitted.push(l));
      service.useNumberFormat('en-US');

      // when
      service.useNumberFormat('auto');

      // then
      expect(service.numberLocaleId()).toBe('de-CH');
      expect(emitted).toEqual(['de', 'de']);
   });

   it('#use should keep chosen number format in new language', async () => {

      // given
      service.useNumberFormat('de-CH');

      // when
      await service.use('ja');

      // then
      expect(service.numberLocaleId()).toBe('de-CH');
   });

   it('#useNumberFormat should switch number format although it cannot be remembered', () => {

      // given
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
      const warn = vi.spyOn(console, 'warn').mockReturnValue(undefined);

      // when
      service.useNumberFormat('de-DE');

      // then
      expect(service.numberLocaleId()).toBe('de-DE');
      expect(warn).toHaveBeenCalledWith('number format cannot be remembered', expect.any(Error));
   });
});
