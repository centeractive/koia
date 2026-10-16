import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
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
      browserLanguages = ['en-US'];
      vi.spyOn(navigator, 'languages', 'get').mockImplementation(() => browserLanguages);
      service = TestBed.inject(LanguageService);
   });

   afterEach(() => {
      history.replaceState(null, '', initialUrl);
      localStorage.removeItem(LanguageService.STORAGE_KEY);
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
      vi.spyOn(console, 'warn').mockReturnValue(undefined);

      // when
      await service.use('ja');

      // then
      expect(service.current()).toBe('ja');
   });
});
