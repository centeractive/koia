import { HeaderLines } from './header-lines';

describe('HeaderLines', () => {

   it('#withoutLastLine should drop last line which may be incomplete', () => {
      expect(HeaderLines.withoutLastLine('a,b\nc,d\ne,')).toBe('a,b\nc,d');
   });

   it('#withoutLastLine should return text without line break unchanged', () => {
      expect(HeaderLines.withoutLastLine('a,b,c')).toBe('a,b,c');
   });

   it('#of should return lines without line breaks, empty lines and last line', () => {
      expect(HeaderLines.of('first\r\n\r\nsecond\nthird...')).toEqual(['first', 'second']);
   });

   it('#of should return only line of text without line break', () => {
      expect(HeaderLines.of('single line')).toEqual(['single line']);
   });

   it('#of should return no lines for empty text', () => {
      expect(HeaderLines.of('')).toEqual([]);
   });
});
