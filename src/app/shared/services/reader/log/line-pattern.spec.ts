import { LinePattern, LinePatternError } from './line-pattern';
import { LOG_PATTERNS } from './log-patterns';

describe('LinePattern', () => {

   function errorOf(template: string): LinePatternError {
      try {
         new LinePattern(template);
      } catch (err) {
         return err as LinePatternError;
      }
      return undefined;
   }

   it('#match should split line by time, level, delimited, token and rest placeholders', () => {

      // given
      const pattern = new LinePattern('{Time:time} {Level:level} [{Thread}] {Logger} - {Message}');

      // when
      const values = pattern.match('2024-01-01 10:00:00,123 ERROR [pool-1 thread-2] c.x.Auth - Request failed: timeout');

      // then
      expect(values).toEqual({
         Time: '2024-01-01 10:00:00,123',
         Level: 'ERROR',
         Thread: 'pool-1 thread-2',
         Logger: 'c.x.Auth',
         Message: 'Request failed: timeout'
      });
   });

   it('#match should capture placeholder before trailing literal lazily up to that literal', () => {

      // given
      const pattern = new LinePattern('{Message} [{Thread}]');

      // when
      const values = pattern.match('started [main]');

      // then
      expect(values).toEqual({ Message: 'started', Thread: 'main' });
   });

   it('#match should ignore surrounding whitespace of template', () => {

      // given
      const pattern = new LinePattern(' {Level} {Message} ');

      // when
      const values = pattern.match('INFO ready');

      // then
      expect(values).toEqual({ Level: 'INFO', Message: 'ready' });
   });

   it.each([
      '2024-01-01 10:00:00,123',
      '2024-01-01 10:00:00.123',
      '2024-01-01T10:00:00.123456',
      '2024-01-01T10:00:00Z',
      '2024-01-01T10:00:00.123+01:00',
      '2024-01-01T10:00:00+0100',
      '2024-01-01 10:00'
   ])('#match should accept time %s', time => {

      // given
      const pattern = new LinePattern('{Time:time} {Message}');

      // when
      const values = pattern.match(time + ' done');

      // then
      expect(values).toEqual({ Time: time, Message: 'done' });
   });

   it('#match should not accept time without date', () => {

      // given
      const pattern = new LinePattern('{Time:time} {Message}');

      // when
      const values = pattern.match('10:00:00 done');

      // then
      expect(values).toBeUndefined();
   });

   it('#match should accept level in any case and keep it as written', () => {

      // given
      const pattern = new LinePattern('{Level:level} {Message}');

      // when
      const values = pattern.match('warn disk almost full');

      // then
      expect(values).toEqual({ Level: 'warn', Message: 'disk almost full' });
   });

   it('#match should not accept unknown level', () => {

      // given
      const pattern = new LinePattern('{Level:level} {Message}');

      // when
      const values = pattern.match('[main] disk almost full');

      // then
      expect(values).toBeUndefined();
   });

   it('#match should accept whitespace run for single space of template', () => {

      // given
      const pattern = new LinePattern('{Level} {Message}');

      // when
      const values = pattern.match('INFO    padded');

      // then
      expect(values).toEqual({ Level: 'INFO', Message: 'padded' });
   });

   it('#match should treat regex characters of literals as text', () => {

      // given
      const pattern = new LinePattern('({Code}) *{Message}');

      // when
      const matching = pattern.match('(42) *answer');
      const other = pattern.match('42 answer');

      // then
      expect(matching).toEqual({ Code: '42', Message: 'answer' });
      expect(other).toBeUndefined();
   });

   it('#continuationName should be name of last placeholder', () => {
      expect(new LinePattern('{Level} {Message}').continuationName).toBe('Message');
   });

   it.each([LinePattern.JSON_LINES, LinePattern.LOGFMT])('#continuationName should be undefined for %s', template => {
      expect(new LinePattern(template).continuationName).toBeUndefined();
   });

   it('#match should read object of JSON line with values of any type', () => {

      // given
      const pattern = new LinePattern(LinePattern.JSON_LINES);

      // when
      const values = pattern.match('{"level":"INFO","duration":12,"ok":true,"user":{"id":7}}');

      // then
      expect(values).toEqual({ level: 'INFO', duration: 12, ok: true, user: { id: 7 } });
   });

   it.each([
      ['array', '[1, 2]'],
      ['invalid JSON', '{"level":'],
      ['text', 'INFO started'],
      ['null object', 'null']
   ])('#match should not read JSON line of %s', (_description, line) => {
      expect(new LinePattern(LinePattern.JSON_LINES).match(line)).toBeUndefined();
   });

   it('#match should read key value pairs of logfmt line', () => {

      // given
      const pattern = new LinePattern(LinePattern.LOGFMT);

      // when
      const values = pattern.match('level=info msg="said \\"hi\\"" empty= duration=12ms  ');

      // then
      expect(values).toEqual({ level: 'info', msg: 'said "hi"', empty: '', duration: '12ms' });
   });

   it.each([
      ['token without value', 'level=info started'],
      ['unclosed quote', 'msg="open'],
      ['empty line', ''],
      ['text', 'started']
   ])('#match should not read logfmt line with %s', (_description, line) => {
      expect(new LinePattern(LinePattern.LOGFMT).match(line)).toBeUndefined();
   });

   it('#match should treat json and logfmt as ordinary names within other templates', () => {

      // given
      const pattern = new LinePattern('{json} {Level}');

      // when
      const values = pattern.match('a b');

      // then
      expect(values).toEqual({ json: 'a', Level: 'b' });
   });

   it.each([
      ['no placeholder', 'plain text', 'scene.reader.logPatternNoPlaceholder', undefined],
      ['empty name', '{} {Message}', 'scene.reader.logPatternEmptyName', undefined],
      ['duplicate name', '{Message} {Message}', 'scene.reader.logPatternDuplicateName', { name: 'Message' }],
      ['unclosed brace', '{Level} {Message', 'scene.reader.logPatternUnclosed', undefined],
      ['adjacent placeholders', '{Level}{Message}', 'scene.reader.logPatternAdjacent', undefined],
      ['unknown kind', '{Time:date} {Message}', 'scene.reader.logPatternUnknownKind', { kind: 'date' }]
   ])('constructor should reject template with %s', (_description, template, key, params) => {

      // when
      const error = errorOf(template);

      // then
      expect(error).toBeInstanceOf(LinePatternError);
      expect(error.key).toBe(key);
      expect(error.params).toEqual(params);
   });

   it.each([
      [LOG_PATTERNS[0], '2024-01-01 10:00:00,123 ERROR [main] c.x.Auth - failed'],
      [LOG_PATTERNS[1], '2024-01-01 10:00:00.123 [main] INFO  c.x.Auth - started'],
      [LOG_PATTERNS[2], '2024-01-01 10:00:00,123 - app.auth - WARNING - slow'],
      [LOG_PATTERNS[3], 'ERROR:app.auth:failed'],
      [LOG_PATTERNS[4], '2024-01-01T10:00:00.123456+01:00 node-7 sshd[123]: accepted'],
      [LOG_PATTERNS[5], '2024-01-01 10:00:00 INFO ready'],
      [LOG_PATTERNS[6], '{"level":"INFO"}'],
      [LOG_PATTERNS[7], 'level=info msg=ready']
   ])('preset %s should match its sample line', (template, line) => {
      expect(new LinePattern(template).match(line)).toBeDefined();
   });
});
