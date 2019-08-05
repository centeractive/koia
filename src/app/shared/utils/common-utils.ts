import { DataType, Column, TimeUnit } from '../model';

export class CommonUtils {

  /**
   * @return abbreviated string using ellipses or specified string if it doesn't exceed [[maxWidth]]
   */
  static abbreviate(str: string, maxWidth: number): string {
    if (!str || str.length <= maxWidth) {
      return str;
    }
    return str.substr(0, maxWidth - 3) + '...';
  }

  /**
   * @returns the encoded URL where each instance of certain characters are replaced escape sequences representing
   * the UTF-8 encoding of the character (additionally #encodeURI, this method also replaces each instance of '#')
   */
  static encodeURL(url: string): string {
    if (url) {
      return encodeURI(url).replace('#', '%23');
    }
    return url;
  }

  /**
   * @returns the URL without the query
   */
  static extractBaseURL(url: string): string {
    const iQuery = url.indexOf('?');
    if (iQuery === -1) {
      return url;
    }
    return url.substring(0, iQuery);
  }

  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * capitalizes a string changing the first letter to uppercase; no other letters are changed
   */
  static capitalize(s: string): string {
    if (s && s.length > 0) {
      return s[0].toUpperCase() + s.slice(1);
    }
    return s;
  }

  /**
   * @returns <true> if the specified objects are equal, <false> otherwise
   */
  static compare(o1: Object, o2: Object): boolean {
    if (o1 === o2 || (!o1 && !o2)) {
      return true;
    } else if (!o1 || !o2) {
      return false;
    }
    return JSON.stringify(o1) === JSON.stringify(o2);
  }

  /**
   * @returns a clone (copy) of the specified object or array, the value itself if it's a primitive
   */
  static clone(value: {} | []): {} | [] {
    if (value) {
      return JSON.parse(JSON.stringify(value));
    }
    return value;
  }

  /**
   * @returns a label of pattern "<column name> (per <time unit>)" for time columns that have time unit defined, the column name otherwise
   */
  static labelOf(column: Column, timeUnit: TimeUnit): string {
    if (column.dataType === DataType.TIME && timeUnit && timeUnit !== TimeUnit.MILLISECOND) {
      return column.name + ' (per ' + timeUnit + ')';
    }
    return column.name;
  }
}
