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
      expect(StringUtils.capitalize('')).toBe('');
   });

   it('#capitalize should return null when null', () => {
      expect(StringUtils.capitalize(null)).toBeNull();
   });

   it('#capitalize should return capitalized string', () => {
      expect(StringUtils.capitalize('x')).toBe('X');
      expect(StringUtils.capitalize('test')).toBe('Test');
   });

   it('#capitalize should return unchanged string when starting with uppercase', () => {
      expect(StringUtils.capitalize('X')).toBe('X');
      expect(StringUtils.capitalize('Test')).toBe('Test');
   });

   it('#pluralize', () => {
      expect(StringUtils.pluralize('test', 0)).toBe('test');
      expect(StringUtils.pluralize('test', 1)).toBe('test');
      expect(StringUtils.pluralize('test', 2)).toBe('tests');
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

   it('#replace when text is missing', () => {
      expect(StringUtils.replace(null, 0, 0, null)).toEqual({ text: null, caret: 0 });
      expect(StringUtils.replace(null, 0, 0, '')).toEqual({ text: '', caret: 0 });
      expect(StringUtils.replace(null, 0, 0, 'xyz')).toEqual({ text: 'xyz', caret: 3 });

      expect(StringUtils.replace(undefined, 0, 0, undefined)).toEqual({ text: undefined, caret: 0 });
      expect(StringUtils.replace(undefined, 0, 0, '')).toEqual({ text: '', caret: 0 });
      expect(StringUtils.replace(undefined, 0, 0, 'xyz')).toEqual({ text: 'xyz', caret: 3 });
   });

   it('#replace when replacement is missing', () => {
      expect(StringUtils.replace('', 0, 0, null)).toEqual({ text: '', caret: 0 });
      expect(StringUtils.replace('abc', 1, 1, null)).toEqual({ text: 'abc', caret: 1 });
      expect(StringUtils.replace('abc', 0, 1, null)).toEqual({ text: 'bc', caret: 0 });
      expect(StringUtils.replace('abc', 1, 2, null)).toEqual({ text: 'ac', caret: 1 });
      expect(StringUtils.replace('abc', 2, 3, null)).toEqual({ text: 'ab', caret: 2 });
   });

   it('#replace when text and replacement are provided', () => {
      expect(StringUtils.replace('', 0, 0, '')).toEqual({ text: '', caret: 0 });
      expect(StringUtils.replace('abc', 1, 1, 'x')).toEqual({ text: 'axbc', caret: 2 });
      expect(StringUtils.replace('abc', 0, 1, 'x')).toEqual({ text: 'xbc', caret: 1 });
      expect(StringUtils.replace('abc', 1, 2, 'x')).toEqual({ text: 'axc', caret: 2 });
      expect(StringUtils.replace('abc', 2, 3, 'x')).toEqual({ text: 'abx', caret: 3 });
      expect(StringUtils.replace('abc', 3, 3, 'x')).toEqual({ text: 'abcx', caret: 4 });
   });

   it('#nonSelected when text is missing', () => {
      expect(StringUtils.nonSelected(null, 0, 0)).toBeNull();
      expect(StringUtils.nonSelected(undefined, 0, 0)).toBeUndefined();
   });

   it('#nonSelected when no text is selected', () => {
      expect(StringUtils.nonSelected('', 0, 0)).toBe('');
      expect(StringUtils.nonSelected('abc', 0, 0)).toBe('abc');
      expect(StringUtils.nonSelected('abc', 1, 1)).toBe('abc');
      expect(StringUtils.nonSelected('abc', 2, 2)).toBe('abc');
      expect(StringUtils.nonSelected('abc', 3, 3)).toBe('abc');
   });

   it('#nonSelected when text is selected', () => {
      expect(StringUtils.nonSelected('abc', 0, 1)).toBe('bc');
      expect(StringUtils.nonSelected('abc', 0, 2)).toBe('c');
      expect(StringUtils.nonSelected('abc', 0, 3)).toBe('');
      expect(StringUtils.nonSelected('abc', 1, 2)).toBe('ac');
      expect(StringUtils.nonSelected('abc', 1, 3)).toBe('a');
      expect(StringUtils.nonSelected('abc', 2, 3)).toBe('ab');
   });
});
