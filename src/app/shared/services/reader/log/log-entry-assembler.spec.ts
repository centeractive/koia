import { LinePattern } from './line-pattern';
import { LogEntryAssembler } from './log-entry-assembler';

describe('LogEntryAssembler', () => {

   let entries: object[];

   beforeEach(() => {
      entries = [];
   });

   function assemblerOf(template: string, wanted = Number.MAX_SAFE_INTEGER): LogEntryAssembler {
      return new LogEntryAssembler(new LinePattern(template), entry => {
         entries.push(entry);
         return entries.length < wanted;
      });
   }

   it('should append non-matching lines like stack traces to last value of entry before', () => {

      // given
      const assembler = assemblerOf('{Level:level} {Message}');

      // when
      ['ERROR failed', 'java.lang.IllegalStateException: boom', '\tat c.x.Auth.login(Auth.java:12)', 'INFO ready']
         .forEach(line => assembler.add(line));
      assembler.finish();

      // then
      expect(entries).toEqual([
         { Level: 'ERROR', Message: 'failed\njava.lang.IllegalStateException: boom\n\tat c.x.Auth.login(Auth.java:12)' },
         { Level: 'INFO', Message: 'ready' }
      ]);
   });

   it('should ignore non-matching lines before first entry and empty lines', () => {

      // given
      const assembler = assemblerOf('{Level:level} {Message}');

      // when
      ['header line', '', '   ', 'INFO ready', ''].forEach(line => assembler.add(line));
      assembler.finish();

      // then
      expect(entries).toEqual([{ Level: 'INFO', Message: 'ready' }]);
   });

   it('should ignore non-matching lines of pattern without continuation', () => {

      // given
      const assembler = assemblerOf(LinePattern.JSON_LINES);

      // when
      ['{"a":1}', 'not json', '{"a":2}'].forEach(line => assembler.add(line));
      assembler.finish();

      // then
      expect(entries).toEqual([{ a: 1 }, { a: 2 }]);
   });

   it('#add should pass on entry not before next entry starts', () => {

      // given
      const assembler = assemblerOf('{Level:level} {Message}');

      // when
      assembler.add('INFO a');
      assembler.add('continued');

      // then
      expect(entries).toEqual([]);
   });

   it('#finish should pass on nothing without pending entry', () => {

      // given
      const assembler = assemblerOf('{Level:level} {Message}');

      // when
      const wanted = assembler.finish();

      // then
      expect(wanted).toBe(true);
      expect(entries).toEqual([]);
   });

   it('#add should return false when no more entries are wanted', () => {

      // given
      const assembler = assemblerOf('{Level:level} {Message}', 1);
      assembler.add('INFO a');

      // when
      const wanted = assembler.add('INFO b');

      // then
      expect(wanted).toBe(false);
      expect(entries).toEqual([{ Level: 'INFO', Message: 'a' }]);
   });

   it('#add should return true for lines that do not complete an entry', () => {

      // given
      const assembler = assemblerOf('{Level:level} {Message}', 1);

      // when
      const results = [assembler.add('INFO a'), assembler.add('continued'), assembler.add('')];

      // then
      expect(results).toEqual([true, true, true]);
   });
});
