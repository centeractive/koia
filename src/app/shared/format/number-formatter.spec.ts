import { NumberUtils } from '../utils/number-utils';
import { NumberFormatter } from './number-formatter';

describe('NumberFormatter', () => {

   const formatter = new NumberFormatter();

   it('#format should return empty string when number is missing', () => {
      expect(formatter.format(null)).toBe('');
      expect(formatter.format(undefined)).toBe('');
   });

   it('#formatValue should return formatted string using current locale', () => {
      expect(formatter.format(-95.5132)).toBe((-95.5132).toLocaleString('en-US', { minimumFractionDigits: 4 }));
      expect(formatter.format(-0.1)).toBe((-0.1).toLocaleString('en-US'));
      expect(formatter.format(0)).toBe('0');
      expect(formatter.format(0.1)).toBe((0.1).toLocaleString('en-US'));
      expect(formatter.format(95.5132)).toBe((95.5132).toLocaleString('en-US', { minimumFractionDigits: 4 }));
   });

   it('#format should return string with thousands separator from current locale', () => {
      expect(formatter.format(-1_000_000.5)).toBe((-1_000_000.5).toLocaleString('en-US'))
      expect(formatter.format(1_000_000.5)).toBe((1_000_000.5).toLocaleString('en-US'))
   });

   it.each(['en-US', 'de-CH', 'fr-FR', 'sv-SE', 'en-IN', 'ar-EG', 'fa-IR', 'he-IL'])('#parse should return number formatted for %s', locale => {

      // given
      const f = new NumberFormatter(locale);
      const numbers = [-1_234_567.5, 0.12345, 1000, -5, 0];

      // when
      const parsed = numbers.map(n => f.parse(f.format(n)));

      // then
      expect(parsed).toEqual(numbers);
   });

   it('#parse should return undefined when string is no formatted number', () => {

      // given
      const f = new NumberFormatter('en-US');

      // when
      const parsed = ['abc', '', '1 2', '-'].map(s => f.parse(s));

      // then
      expect(parsed).toEqual([undefined, undefined, undefined, undefined]);
   });

   it('#format should format for given locale', () => {

      // when
      const formatted = new NumberFormatter('de-CH').format(1234.5);

      // then
      expect(formatted).toBe((1234.5).toLocaleString('de-CH'));
   });

   it('#format should use locale of numbers of user interface by default', () => {

      // given
      vi.spyOn(NumberUtils, 'defaultLocale').mockReturnValue('de-CH');

      // when
      const formatted = new NumberFormatter().format(1234.5);

      // then
      expect(formatted).toBe('1\'234.5');
   });

   it('#parse should follow change of locale of numbers of user interface', () => {

      // given
      const defaultLocale = vi.spyOn(NumberUtils, 'defaultLocale').mockReturnValue('en-US');
      const f = new NumberFormatter();
      expect(f.parse('1,234.5')).toBe(1234.5);
      defaultLocale.mockReturnValue('de');

      // when
      const parsed = f.parse('1.234,5');

      // then
      expect(parsed).toBe(1234.5);
   });
});
