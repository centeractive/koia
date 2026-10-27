export class CommonUtils {

  /**
   * @returns the encoded URL where each instance of certain characters are replaced by an escape sequences representing
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
   * resolves after the browser painted the next frame, which lets a progress indicator start before blocking work;
   * does not resolve while the document is hidden because animation frames are paused then
   */
  static afterNextPaint(): Promise<void> {
    return new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve)));
  }

  /**
   * @returns <true> if the specified objects are equal, <false> otherwise
   */
  static compare(o1: object, o2: object): boolean {
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
  static clone<T>(value: T): T {
    if (value) {
      return JSON.parse(JSON.stringify(value));
    }
    return value;
  }
}
