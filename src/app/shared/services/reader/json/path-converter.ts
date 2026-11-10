export class PathConverter {

   private static readonly DOT_NOTATION_KEY = /^[\w-]+$/;

   /**
    * keys that oboe cannot match in dot notation (e.g. with spaces, dots or non-ASCII letters) are put into bracket notation
    *
    * @see https://goessner.net/articles/JsonPath/
    */
   toJSONPath(path: string[]): string {
      if (!path || path.length === 0) {
         return '$';
      }
      return '$' + path.map(key => PathConverter.DOT_NOTATION_KEY.test(key) ? '.' + key : '["' + key + '"]').join('');
   }

   /**
    * @see http://oboejs.com/api#pattern-matching
    */
   toOboeMatchPattern(jsonPath: string): string {
      if (!jsonPath || jsonPath.trim() === '') {
         jsonPath = '!';
      }
      if (jsonPath.startsWith('$')) {
         jsonPath = '!' + jsonPath.substring(1);
      }
      return jsonPath + '.*';
   }
}
