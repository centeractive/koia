import { LanguageService } from 'app/shared/services/language';
import { LocalizedNumberPipe } from './localized-number.pipe';

describe('LocalizedNumberPipe', () => {

   it('#format should format number in given locale', () => {

      // when
      const formatted = LocalizedNumberPipe.format(1234.5, 'de');

      // then
      expect(formatted).toBe('1.234,5');
   });

   it('#format should return null for non-numeric value', () => {

      // when
      const formatted = LocalizedNumberPipe.format('abc', 'en-US');

      // then
      expect(formatted).toBeNull();
   });

   it('#transform should format number in locale of current language', () => {

      // given
      const pipe = new LocalizedNumberPipe({ localeId: () => 'de' } as LanguageService);

      // when
      const formatted = pipe.transform(1234.5, '1.2-2');

      // then
      expect(formatted).toBe('1.234,50');
   });
});
