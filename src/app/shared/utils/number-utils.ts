export class NumberUtils {

   /**
    * @returns [[true]], if the value is an integer or represents an integer (may contain thousands separators of the specified locale),
    * [[false]] otherwise (non-compliant string, boolean, object, array etc.). If the number contains the decimal separator, it is not
    * considered to be an integer, even if the digit after the decimal separator is zero (i.e. '1.0').
    *
    * Note: the number 1.0 is considered to be an integer but the string '1.0' is not.
    */
   static isInteger(value: any, locale: string): boolean {
      if (value !== null && value !== undefined && this.isNumber(value, locale)) {
         if (typeof value === 'string') {
            if (value.includes(this.decimalSeparator(locale))) {
               return false;
            }
            return Number.isInteger(Number(this.normalize(value, locale)));
         }
         return Number.isInteger(value);
      }
      return false;
   }

   /**
    * @returns [[true]], if the value is a number or represents a number (may contain thousands separators of the specified locale),
    * [[false]] otherwise (non-compliant string, boolean, object, array etc.)
    */
   static isNumber(value: any, locale: string): boolean {
      if (value === 0) {
         return true;
      } else if (!value || typeof value === 'boolean' || typeof value === 'object' || Array.isArray(value)) {
         return false;
      } else if (typeof value === 'string') {
         return this.representsNumber(value, locale);
      }
      return !Number.isNaN(value);
   }

   /**
    * @returns [[true]], if the string represents a number (may contain thousands separators of the specified locale)
    */
   static representsNumber(str: string, locale: string): boolean {
      if (!str) {
         return false;
      }
      str = str.trim();
      if (str === '') {
         return false;
      }
      const decimalTokens = str.split(this.decimalSeparator(locale));
      if (decimalTokens.length == 1) {
         const thousandTokens = str.split(this.thousandsSeparator(locale));
         if (!this.checkThousandTokens(thousandTokens)) {
            return false;
         }
         str = thousandTokens.join('');
      } else if (decimalTokens.length == 2) {
         const thousandTokens = decimalTokens[0].split(this.thousandsSeparator(locale));
         if (decimalTokens[0].length > 3) {
            if (!this.checkThousandTokens(thousandTokens)) {
               return false;
            }
         }
         str = thousandTokens.join('') + '.' + decimalTokens[1];
      } else {
         return false;
      }
      return !isNaN(Number(str));
   }

   /**
   * converts a string to a parsable number presentation, a number without thousands separator and with
   * the locale-specific decimal separator.
   *
   * @param str  a number that may contain thousands separators of the specified locale
   * @returns normalized number or [[undefined]] if the specified string does not represent a number
   */
   static normalize(str: string, locale: string): string {
      if (!str) {
         return undefined;
      }
      str = str.trim();
      if (str === '') {
         return undefined;
      }
      const decimalTokens = str.split(this.decimalSeparator(locale));
      if (decimalTokens.length == 1) {
         const thousandTokens = str.split(this.thousandsSeparator(locale));
         if (!this.checkThousandTokens(thousandTokens)) {
            return undefined;
         }
         str = thousandTokens.join('');
      } else if (decimalTokens.length == 2) {
         const thousandTokens = decimalTokens[0].split(this.thousandsSeparator(locale));
         if (decimalTokens[0].length > 3) {
            if (!this.checkThousandTokens(thousandTokens)) {
               return undefined;
            }
         }
         str = thousandTokens.join('') + '.' + decimalTokens[1];
      } else {
         return undefined;
      }
      return str;
   }

   private static checkThousandTokens(tokens: string[]): boolean {
      if (!Number.isInteger(Number(tokens[0]))) {
         return false;
      }
      for (let i = 1; i < tokens.length; i++) {
         if (tokens[i].length != 3 || !Number.isInteger(Number(tokens[i]))) {
            return false;
         }
      }
      return true;
   }

   /**
    * @returns the value as a number, 1 for boolean [[true]], 0 for boolean [[false]]
    */
   static asNumber(value: string | number | boolean, locale: string): number {
      if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
         return undefined;
      }
      if (typeof value === 'number') {
         return value;
      } else if (typeof value === 'boolean') {
         return value ? 1 : 0;
      } else if (typeof value === 'string') {
         const result = this.parseNumber(value as string, locale);
         return isNaN(result) ? undefined : result;
      }
      return undefined;
   }

   /**
    * converts a string to a number
    *
    * @param str  integer or float that may contain thousands separators of the specified locale
    * @returns a number or [[undefined]] if the specified string does not represent a number
    */
   static parseNumber(str: string, locale: string): number {
      if (!str || str.trim() === '') {
         return undefined;
      }
      str = this.normalize(str, locale);
      if (!str) {
         return undefined;
      }
      return str.indexOf('.') >= 0 ? parseFloat(str) : parseInt(str);
   }

   /**
    * converts a string to an integer
    *
    * @param str  a number that may contain thousands separators of the specified locale
    * @returns an integer or [[undefined]] if the specified string does not represent an integer
    */
   static parseInt(str: string, locale: string): number {
      if (!str || str.trim() === '') {
         return undefined;
      } else if (!this.isNumber(str.slice(-1), locale) || str.indexOf(this.decimalSeparator(locale)) > 0) {
         return undefined;
      } else if (!this.representsNumber(str, locale)) {
         return undefined;
      }
      return parseInt(this.removeThousandsSeparators(str, locale), 10);
   }

   /**
    * converts a string to a floating-point number
    *
    * @param str  a number that may contain thousands separators of the specified locale
    * @returns a floating number or [[undefined]] if the specified string does not represent a number
    */
   static parseFloat(str: string, locale: string): number {
      if (!str || str.trim() === '') {
         return undefined;
      }
      if (str.startsWith(this.decimalSeparator(locale))) {
         str = '0' + str;
      }
      if (!this.isNumber(str.slice(-1), locale) ||
         str.indexOf(this.decimalSeparator(locale)) !== str.lastIndexOf(this.decimalSeparator(locale))) {
         return undefined;
      } else if (!this.representsNumber(str, locale)) {
         return undefined;
      }
      return parseFloat(this.normalize(str, locale));
   }

   /**
    * removes thousands separators regardless of whether they appear at correct position
    */
   static removeThousandsSeparators(str: string, locale: string): string {
      return str.split(this.thousandsSeparator(locale)).join('');
   }

   /**
    * @returns the number of digits found after the decimal point (max returned value is 20)
    */
   static countDecimals(num: number, locale: string): number {
      if (!num || Math.floor(num) === num) {
         return 0;
      }
      const tokens = num.toLocaleString(locale, { maximumFractionDigits: 20 })
         .split(this.decimalSeparator(locale));
      return tokens.length === 2 ? tokens[1].length : 0;
   }

   static thousandsSeparator(locale: string): string {
      return Number(1_000).toLocaleString(locale).charAt(1);
   }

   static decimalSeparator(locale: string): string {
      return Number(1.1).toLocaleString(locale).charAt(1);
   }

   /**
    * @returns the number of digits found in the specified string
    */
   static countDigits(s: string): number {
      return s ? s.replace(/[^0-9]/g, '').length : 0;
   }

   static min(n1: number, n2: number): number | undefined {
      if (n1 == undefined) {
         return n2;
      } else if (n2 == undefined) {
         return n1;
      }
      return Math.min(n1, n2);
   }

   static max(n1: number, n2: number): number | undefined {
      if (n1 == undefined) {
         return n2;
      } else if (n2 == undefined) {
         return n1;
      }
      return Math.max(n1, n2);
   }

   /**
    * @returns the difference between two numbers as an absolute value
    */
   static diff(n1: number, n2: number): number {
      return Math.abs(n1 - n2);
   }

   /**
    * returns a sequential ordered array from 1 to endInclusive (inclusive) by an incremental step of 1
    *
    * @param endInclusive the inclusive upper bound
    */
   static rangeClosedIntArray(endInclusive: number): number[] {
      return Array.from(new Array(endInclusive), (n, i) => i + 1);
   }

   /**
    * returns a sequential ordered array of floats within a certain range
    *
    * @param count the number of floats to be contained in the resulting array
    * @param range <first> and <last> float to be contained in the resulting array, 
    *              if <count> is 1 however, the returned value will be inbetween <first> and <last>
    */
   static rangeFloatArray(count: number, range: { from: number, to: number } = { from: 0, to: 1 }): number[] {
      if (range.to - range.from < 0) {
         throw Error('<options.to> must not be less than <options.from>');
      }
      if (count <= 0) {
         return [];
      } else if (count === 1) {
         return [(range.from + range.to) / 2];
      }
      const gap = (range.to - range.from) / (count - 1);
      const result = [range.from];
      for (let i = 0, v = range.from + gap; i < count - 2; i++, v += gap) {
         result.push(v);
      }
      result.push(range.to);
      return result;
   }

   /**
    * @returns a sequential ordered array of integers 
    */
   static intArray(from: number, to: number): number[] {
      const count = to - from + 1;
      return Array.from(new Array(count), (x, i) => i + from);
   }

   /**
    * generates an array of event spread numbers between minValue and maxValue
    *
    * @returns an array containing as many numbers as specified by <count>, the lowest number being <min>, the largest number being <max>,
    * an empty array is returned when count is less than 2 or min is greater than max.
    */
   static generateEvenSpreadNumbers(count: number, min: number, max: number): number[] {
      if (count < 2 || min > max) {
         return [];
      }
      const numbers: number[] = new Array(count);
      const diffPerEntry = (max - min) / (count - 1);
      let value = min;
      for (let i = 0; i < count - 1; i++) {
         numbers[i] = value;
         value += diffPerEntry;
      }
      numbers[count - 1] = max;
      return numbers;
   }

   /**
    * computes the base power of ten of the specified number
    *
    *    num    -> returns
    *    -----------------
    *    -0.008 -> 0.001
    *    -0.925 -> 0.1
    *    -5     -> 1
    *    -32    -> 10
    *    -378   -> 100
    *    -8'812 -> 1'000
    *
    *    0.008  -> 0.001
    *    0.925  -> 0.1
    *    5      -> 1
    *    32     -> 10
    *    378    -> 100
    *    8'812  -> 1'000
    *
    * @returns positive base power of ten or the specified number when undefined or zero
    */
   static basePowerOfTen(num: number): number {
      if (!num || num === 0) {
         return num;
      }
      if (num > -1 && num < 1) {
         const factor = this.basePowerOfTen(1 / num * 10);
         return this.basePowerOfTen(num * factor) / factor;
      }
      const intString = Math.abs(num < 0 ? Math.ceil(num) : Math.floor(num)).toString();
      return parseInt('1' + intString.substring(1).replace(/./g, '0'), 10);
   }

   /**
    * rounds the number up to the nearest broad number as follows
    *
    *    num    -> returns
    *    -----------------
    *    -0.0083 -> -0.008
    *    -0.51   -> -0.5
    *    -7.21   -> -7
    *    -16     -> -10
    *    -8252   -> -8000
    *    -17'681 -> -20'000
    *
    *    0.0083  -> 0.009
    *    0.51    -> 0.6
    *    7.21    -> 8
    *    16      -> 20
    *    8252    -> 9000
    *    17'681  -> 20'000
    *
    * @returns computed number or the specified number when undefined or zero
    */
   static roundUpBroad(num: number): number {
      if (!num || num === 0) {
         return num;
      }
      if (num > -1 && num < 1) {
         const factor = this.basePowerOfTen(1 / num * 10);
         return this.roundUpBroad(num * factor) / factor;
      }
      const numString = Math.ceil(Math.abs(num)).toString();
      const round = parseInt('1' + numString.substring(1).replace(/./g, '0'), 10);
      return Math.ceil(num / round) * round;
   }

   /**
    * computes the start index after the decimal point
    *
    * @returns a positive number or 0 when the specified number is >= 0.1 or <= -0.1
    *
    *    num    -> returns
    *    -----------------
    *
    *    -1.01  -> 0
    *    -0.1   -> 0
    *    -0.02  -> 1
    *    -0.004 -> 2
    *
    *    1.01   -> 0
    *    0.1    -> 0
    *    0.02   -> 1
    *    0.004  -> 2
    */
   static startIndexAfterDecimalPoint(num: number): number {
      const abs = Math.abs(num);
      if (abs >= 0.1 || abs <= -0.1) {
         return 0;
      }
      return -Math.floor(Math.log(abs) / Math.log(10) + 1);
   }

   /**
    * @returns true if the key is part of a number (digit, minus sign or decimal separator), false otherwise
    */
   static isNumberKey(event: KeyboardEvent): boolean {
      if (event.key === '-' || this.isLocaleDecimalSeparator(event.key)) {
         return true;
      }
      return event.key !== ' ' && !isNaN(Number(event.key));
   }

   static isLocaleDecimalSeparator(char: string): boolean {
      return char === (0.1).toLocaleString().substring(1, 2);
   }

}
