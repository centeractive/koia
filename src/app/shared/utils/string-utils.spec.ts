import { StringUtils } from './string-utils';

describe('StringUtils', () => {

   it('#abbreviate should return same when null or undefined', () => {
      expect(StringUtils.abbreviate(null, 10)).toBeNull();
      expect(StringUtils.abbreviate(undefined, 10)).toBeUndefined();
   });

   it('#abbreviate should return same string when max width is not exceeded', () => {
      expect(StringUtils.abbreviate('', 10)).toBe('');
      expect(StringUtils.abbreviate('a', 10)).toBe('a');
      expect(StringUtils.abbreviate('0123456789', 10)).toBe('0123456789');
   });

   it('#abbreviate should return abbreviated string when max width is exceeded', () => {
      expect(StringUtils.abbreviate('0123456789X', 10)).toBe('0123456...');
      expect(StringUtils.abbreviate('0123456789XY', 10)).toBe('0123456...');
      expect(StringUtils.abbreviate('0123456789XYZ', 10)).toBe('0123456...');
      expect(StringUtils.abbreviate('whenever a text exceeds max length', 26)).toBe('whenever a text exceeds...');
   });

   it('#capitalize should return string when EMPTY', () => {
      expect(StringUtils.capitalize('')).toEqual('');
   });

   it('#capitalize should return null when null', () => {
      expect(StringUtils.capitalize(null)).toBeNull();
   });

   it('#capitalize should return capitalized string', () => {
      expect(StringUtils.capitalize('x')).toEqual('X');
      expect(StringUtils.capitalize('test')).toEqual('Test');
   });

   it('#capitalize should return unchanged string when starting with uppercase', () => {
      expect(StringUtils.capitalize('X')).toEqual('X');
      expect(StringUtils.capitalize('Test')).toEqual('Test');
   });

   it('#quote should return quoted empty string when input is missing or empty', () => {
      expect(StringUtils.quote(null)).toBe('\'\'');
      expect(StringUtils.quote(undefined)).toBe('\'\'');
      expect(StringUtils.quote('')).toBe('\'\'');
   });

   it('#quote should return quoted string', () => {
      expect(StringUtils.quote('abc')).toBe('\'abc\'');
      expect(StringUtils.insertAt('abc', '-', 0)).toBe('-abc');
      expect(StringUtils.insertAt('abc', '-', 1)).toBe('a-bc');
      expect(StringUtils.insertAt('abc', '-', 2)).toBe('ab-c');
      expect(StringUtils.insertAt('abc', '-', 3)).toBe('abc-');
   });

   it('#removeCharAt should remove character', () => {
      expect(StringUtils.removeCharAt('abc', 0)).toBe('bc');
      expect(StringUtils.removeCharAt('abc', 1)).toBe('ac');
      expect(StringUtils.removeCharAt('abc', 2)).toBe('ab');
   });

   it('#occurrences should return zero when word is not contained', () => {
      expect(StringUtils.occurrences('abc', 'x')).toBe(0);
   });

   it('#occurrences should return positive integer when word is contained', () => {
      expect(StringUtils.occurrences('abcabc', 'ca')).toBe(1);
      expect(StringUtils.occurrences('abcabc', 'bc')).toBe(2);
      expect(StringUtils.occurrences('abcabc', 'ab')).toBe(2);
   });
});
