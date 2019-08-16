export class StringUtils {

   static readonly EMPTY = '';

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
   * capitalizes a string changing the first letter to uppercase; no other letters are changed
   */
  static capitalize(s: string): string {
   if (s && s.length > 0) {
     return s[0].toUpperCase() + s.slice(1);
   }
   return s;
 }

   /**
    * quote the given string with single quotes
    *
    * @param the quoted string (e.g. "'mystring'"), or "''" if the input was null
    */
   static quote(s: string): string {
      return '\'' + (s || StringUtils.EMPTY) + '\'';
   }
}
