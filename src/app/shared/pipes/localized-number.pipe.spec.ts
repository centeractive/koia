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

   it('#transform should format number in locale of numbers of user interface', () => {

      // given
      const pipe = new LocalizedNumberPipe({ numberLocaleId: () => 'de-CH' } as LanguageService);

      // when
      const formatted = pipe.transform(1234.5);

      // then
      expect(formatted).toBe('1\'234.5');
   });

   it('#format should show numbers rounded to zero without sign', () => {

      // when
      const formatted = [LocalizedNumberPipe.format(-0, 'en-US'), LocalizedNumberPipe.format(-0.0004, 'en-US')];

      // then
      expect(formatted).toEqual(['0', '0']);
   });
});
