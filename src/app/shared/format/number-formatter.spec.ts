import { NumberFormatter } from './number-formatter';

describe('NumberFormatter', () => {

   const formatter = new NumberFormatter();

   it('#format should return empty string when number is missing', () => {
      expect(formatter.format(null)).toBe('');
      expect(formatter.format(undefined)).toBe('');
   });

   it('#formatValue should return formatted string using current locale', () => {
      expect(formatter.format(-95.5132)).toBe((-95.5132).toLocaleString(undefined, { minimumFractionDigits: 4 }));
      expect(formatter.format(-0.1)).toBe((-0.1).toLocaleString());
      expect(formatter.format(0)).toBe('0');
      expect(formatter.format(0.1)).toBe((0.1).toLocaleString());
      expect(formatter.format(95.5132)).toBe((95.5132).toLocaleString(undefined, { minimumFractionDigits: 4 }));
   });

   it('#format should return string with thousands separator from current locale', () => {
      expect(formatter.format(-1_000_000.5)).toBe((-1_000_000.5).toLocaleString())
      expect(formatter.format(1_000_000.5)).toBe((1_000_000.5).toLocaleString())
   });
});
