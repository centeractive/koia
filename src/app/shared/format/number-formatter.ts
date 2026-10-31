import { NumberUtils } from '../utils/number-utils';

export class NumberFormatter {

   private static readonly BIDI_MARKS = ['‎', '‏', '؜'];

   private symbols: { digits: string[], decimal: string, minusSigns: string[], group: string, ignored: string[] };

   /**
    * @param locale the browser's locale by default
    */
   constructor(private readonly locale?: string) { }

   format(num: number): string {
      if (num == undefined) {
         return '';
      }
      const decimals = NumberUtils.countDecimals(num, this.locale);
      if (decimals > 3) {
         return num.toLocaleString(this.locale, { minimumFractionDigits: decimals });
      }
      return num.toLocaleString(this.locale);
   }

   /**
    * @returns the number of a string returned by [[#format]], undefined when the string is no such number
    */
   parse(str: string): number | undefined {
      const symbols = this.symbolsOfLocale();
      let normalized = '';
      for (const char of str.trim()) {
         const digit = symbols.digits.indexOf(char);
         if (digit >= 0) {
            normalized += digit;
         } else if (char === symbols.decimal) {
            normalized += '.';
         } else if (symbols.minusSigns.includes(char)) {
            normalized += '-';
         } else if (char !== symbols.group && !symbols.ignored.includes(char)) {
            return undefined;
         }
      }
      const num = normalized === '' ? NaN : Number(normalized);
      return Number.isNaN(num) ? undefined : num;
   }

   private symbolsOfLocale() {
      if (!this.symbols) {
         const parts = new Intl.NumberFormat(this.locale).formatToParts(-1_234_567.5);
         const symbolOf = (type: string) => parts.find(p => p.type === type).value;
         this.symbols = {
            digits: Array.from({ length: 10 }, (_, d) => d.toLocaleString(this.locale)),
            decimal: symbolOf('decimal'),
            minusSigns: ['-', ...[...symbolOf('minusSign')].filter(c => !NumberFormatter.BIDI_MARKS.includes(c))],
            group: symbolOf('group'),
            ignored: [...NumberFormatter.BIDI_MARKS, ...parts.filter(p => p.type === 'literal').flatMap(p => [...p.value])]
         };
      }
      return this.symbols;
   }
}
