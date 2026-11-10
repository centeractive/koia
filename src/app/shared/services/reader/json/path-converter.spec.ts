import { PathConverter } from './path-converter';

describe('PathConverter', () => {

   const pathConverter = new PathConverter();

   it('#toJSONPath should return root when path is missing', () => {
      expect(pathConverter.toJSONPath(null)).toBe('$');
      expect(pathConverter.toJSONPath(undefined)).toBe('$');
      expect(pathConverter.toJSONPath([])).toBe('$');
   });

   it('#toJSONPath should return non-root path when path is defined', () => {
      expect(pathConverter.toJSONPath(['a'])).toBe('$.a');
      expect(pathConverter.toJSONPath(['a', 'b'])).toBe('$.a.b');
   });

   it.each([
      { path: ['Order Items'], jsonPath: '$["Order Items"]' },
      { path: ['data', 'a.b'], jsonPath: '$.data["a.b"]' },
      { path: ['Größe', '日本'], jsonPath: '$["Größe"]["日本"]' }
   ])('#toJSONPath should put keys with space, dot or non-ASCII letter into bracket notation: $jsonPath', ({ path, jsonPath }) => {

      // when
      const actual = pathConverter.toJSONPath(path);

      // then
      expect(actual).toBe(jsonPath);
   });

   it('#toJSONPath should keep keys of letters, digits, hyphens and underscores in dot notation', () => {

      // when
      const actual = pathConverter.toJSONPath(['a-b_c', '0']);

      // then
      expect(actual).toBe('$.a-b_c.0');
   });

   it('#toOboeMatchPattern should return root pattern when JSONPath is missing', () => {
      expect(pathConverter.toOboeMatchPattern(null)).toBe('!.*');
      expect(pathConverter.toOboeMatchPattern(undefined)).toBe('!.*');
   });

   it('#toOboeMatchPattern should return root pattern when JSONPath is root', () => {
      expect(pathConverter.toOboeMatchPattern('$')).toBe('!.*');
   });

   it('#toOboeMatchPattern should return non-root pattern when JSONPath is non-root', () => {
      expect(pathConverter.toOboeMatchPattern('$.a')).toBe('!.a.*');
      expect(pathConverter.toOboeMatchPattern('$.a.b')).toBe('!.a.b.*');
   });

   it('#toOboeMatchPattern should keep bracket notation of JSONPath', () => {

      // when
      const actual = pathConverter.toOboeMatchPattern('$.data["Order Items"]');

      // then
      expect(actual).toBe('!.data["Order Items"].*');
   });
});
