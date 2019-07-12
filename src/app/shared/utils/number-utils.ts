export class NumberUtils {

   static readonly THOUSANDS_SEPARATOR = Number(1000).toLocaleString().charAt(1);
   static readonly DECIMAL_SEPARATOR = Number(1.1).toLocaleString().charAt(1);

   private static readonly FORMATTED_NUM_REGEX = /^(\+|-)?\s?\d{1,3}(,\d{3})*(\.\d+)?$/;

   /**
    * @returns [[true]], if the value is a n integer or represents an integer (may contain thousands separators of the current locale),
    * [[false]] otherwise (non-compliant string, boolean, object, array etc.)
    */
   static isInteger(value: any): boolean {
      return value !== null && value !== undefined && NumberUtils.isNumber(value) &&
         value.toString().indexOf(NumberUtils.DECIMAL_SEPARATOR) === -1;
   }

   /**
    * @returns [[true]], if the value is a number or represents a number (may contain thousands separators of the current locale),
    * [[false]] otherwise (non-compliant string, boolean, object, array etc.)
    */
   static isNumber(value: any): boolean {
      if (value === 0) {
         return true;
      } else if (!value || typeof value === 'boolean' || typeof value === 'object' || Array.isArray(value)) {
         return false;
      } else if (typeof value === 'string') {
         return this.representsNumber(value);
      }
      return !isNaN(Number(value));
   }

   /**
    * @returns [[true]], if the string represents a number (may contain thousands separators of the current locale)
    */
   static representsNumber(str: string): boolean {
      if (!str) {
         return false;
      }
      str = str.trim();
      if (str.trim() === '') {
         return false;
      } else if (!isNaN(Number(str))) {
         return true;
      }
      return str.match(NumberUtils.FORMATTED_NUM_REGEX) !== null;
   }

   /**
    * @returns the value as a number, 1 for boolean [[true]], 0 for boolean [[false]]
    */
   static asNumber(value: string | number | boolean): number {
      if (value === null || value === undefined || (typeof value === 'string' && (<string>value).trim() === '')) {
         return undefined;
      }
      if (typeof value === 'number') {
         return value;
      } else if (typeof value === 'boolean') {
         return value ? 1 : 0;
      } else if (typeof value === 'string') {
         const result = NumberUtils.parseNumber(<string>value);
         return isNaN(result) ? undefined : result;
      }
      return undefined;
   }

   /**
    * converts a string to a number
    *
    * @param str  integer or float that may contain thousands separators of the current locale
    * @returns a number or [[undefined]] if the specified string does not represent a number
    */
   static parseNumber(str: string): number {
      if (!str || str.trim() === '') {
         return undefined;
      }
      return str.indexOf(NumberUtils.DECIMAL_SEPARATOR) > 0 ? NumberUtils.parseFloat(str) : NumberUtils.parseInt(str);
   }

   /**
    * converts a string to an integer
    *
    * @param str  a number that may contain thousands separators of the current locale
    * @returns an integer or [[undefined]] if the specified string does not represent an integer
    */
   static parseInt(str: string): number {
      if (!str || str.trim() === '') {
         return undefined;
      } else if (!NumberUtils.isNumber(str.slice(-1)) || str.indexOf(NumberUtils.DECIMAL_SEPARATOR) > 0) {
         return undefined;
      } else if (!this.representsNumber(str)) {
         return undefined;
      }
      const result = parseInt(this.removeThousandsSeparators(str), 10);
      return isNaN(result) ? undefined : result;
   }

   /**
    * converts a string to a floating-point number
    *
    * @param str  a number that may contain thousands separators of the current locale
    * @returns a floating number or [[undefined]] if the specified string does not represent a number
    */
   static parseFloat(str: string): number {
      if (!str || str.trim() === '') {
         return undefined;
      } else if (!str || !NumberUtils.isNumber(str.slice(-1)) ||
         str.indexOf(NumberUtils.DECIMAL_SEPARATOR) !== str.lastIndexOf(NumberUtils.DECIMAL_SEPARATOR)) {
         return undefined;
      } else if (!this.representsNumber(str)) {
         return undefined;
      }
      const result = parseFloat(this.removeThousandsSeparators(str));
      return isNaN(result) ? undefined : result;
   }

   private static removeThousandsSeparators(str: string): string {
      return str.split(NumberUtils.THOUSANDS_SEPARATOR).join('');
   }

   /**
    * @returns the number of digits found in the specified string
    */
   static countDigits(s: string): number {
      return s ? s.replace(/[^0-9]/g, '').length : 0;
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
      return Array.from(new Array(endInclusive), (x, i) => i + 1);
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
   static basePowerOfTen(num: number) {
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
   static startIndexAfterDecimalPoint(num: number) {
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

   private static isLocaleDecimalSeparator(key: string): boolean {
      const num = 0.1;
      return key === num.toLocaleString().substring(1, 2);
   }
}
