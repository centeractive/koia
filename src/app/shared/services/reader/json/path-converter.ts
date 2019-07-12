export class PathConverter {

   /**
    * @see https://goessner.net/articles/JsonPath/
    */
   toJSONPath(path: string[]): string {
      if (!path || path.length === 0) {
         return '$';
      }
      return '$.' + path.join('.');
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
