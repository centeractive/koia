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

   static pluralize(s: string, count: number): string {
      return s + (count <= 1 ? '' : 's');
   }

   /**
    * quote the given string with single quotes
    *
    * @param the quoted string (e.g. "'mystring'"), or "''" if the input was null
    */
   static quote(s: string): string {
      return '\'' + (s || StringUtils.EMPTY) + '\'';
   }

   static insertAt(baseString: string, stringToInsert: string, position: number): string {
      if (position === 0) {
         return stringToInsert + baseString;
      } else if (position === baseString.length) {
         return baseString + stringToInsert;
      } else {
         return baseString.substring(0, position) + stringToInsert + baseString.substring(position);
      }
   }

   static removeCharAt(s: string, position: number): string {
      return s.slice(0, position) + s.slice(position + 1);
   }

   /**
    * @returns a number that indicates how many times the 'word' is contained in the 'baseString' (no overlapping)
    */
   static occurrences(baseString: string, word: string): number {
      return baseString.split(word).length - 1;
   }

   /** 
    * removes the selected text and inserts the replacement text instead 
    * 
    * @returns an object containing the following attributes
    *          - text: the new text
    *          - caret: index at the end of the inserted text
    */
   static replace(text: string, selStart: number, selEnd: number, replacement: string): { text: string, caret: number } {
      if (text === null || text === undefined) {
         return {
            text: replacement,
            caret: replacement?.length || 0
         }
      }
      replacement = replacement || '';
      text = text.substring(0, selStart) + replacement + text.substring(selEnd);
      return {
         text,
         caret: selStart + replacement.length
      };
   }

   /** 
    * @returns the non-selected text of the specified string
    */
   static nonSelected(text: string, selStart: number, selEnd: number): string {
      if (!text || selStart === selEnd) {
         return text;
      }
      return text.substring(0, selStart) + text.substring(selEnd);
   }

}
