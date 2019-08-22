import { NumberFormatter } from './number-formatter';

describe('NumberFormatter', () => {

   const formatter = new NumberFormatter();

   it('#format should return empty string when number is missing', () => {
      expect(formatter.format(null)).toBe('');
      expect(formatter.format(undefined)).toBe('');
   });

   it('#formatValue should return formatted string', () => {
      expect(formatter.format(-95.5132)).toBe('-95.5132');
      expect(formatter.format(-0.1)).toBe('-0.1');
      expect(formatter.format(0)).toBe('0');
      expect(formatter.format(0.1)).toBe('0.1');
      expect(formatter.format(95.5132)).toBe('95.5132');
   });

   it('#format should return string with thousands separator', () => {
      const ts = Number(1000).toLocaleString().charAt(1); // Thousands separator

      expect(formatter.format(-1_000_000.5)).toBe('-1' + ts + '000' + ts + '000.5');
      expect(formatter.format(1_000_000.5)).toBe('1' + ts + '000' + ts + '000.5');
   });
});
