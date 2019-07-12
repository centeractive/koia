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
});
