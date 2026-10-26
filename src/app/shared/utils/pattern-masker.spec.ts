import { PatternMasker } from './pattern-masker';

describe('PatternMasker', () => {

   const cases: [string, string][] = [
      ['see https://x.io/a/b?q=1 now', 'see <*> now'],
      ['see "https://x.io/a" now', 'see "<*>" now'],
      ['mail bob@ex.com ok', 'mail <*> ok'],
      ['mail bob@ex.com, ok', 'mail <*>, ok'],
      ['to <bob@ex.com>', 'to <<*>>'],
      ['user @home', 'user @home'],
      ['said "hello world" and `x y`', 'said "<*>" and `<*>`'],
      ['can\'t open', 'can\'t open'],
      ['GET /api/users/123 200 35ms', 'GET /api/users/<*> <*> <*>'],
      ['read /var/log/app.log', 'read /var/log/app.log'],
      ['read C:\\logs\\app.log', 'read C:\\logs\\app.log'],
      ['code:500', 'code:<*>'],
      ['HTTP/1.1', 'HTTP/<*>'],
      ['5 / 10 items', '<*> / <*> items'],
      ['token deadbeef', 'token <*>'],
      ['token DEADBEEF', 'token <*>'],
      ['token deadbee', 'token deadbee'],
      ['flags 0x1f', 'flags <*>'],
      ['version 2.4.1', 'version <*>'],
      ['from 10.0.0.1:5432', 'from <*>:<*>'],
      ['id 550e8400-e29b-41d4-a716-446655440000', 'id <*>'],
      ['at 2024-01-01T10:00:00.123Z', 'at <*>:<*>:<*>'],
      ['took 35ms', 'took <*>'],
      ['host node-7', 'host <*>'],
      ['IPv4 UTF-8 OAuth2', '<*> <*> <*>'],
      ['  a \t  b  ', 'a b'],
      ['Request r10042 failed: upstream timeout', 'Request <*> failed: upstream timeout'],
      ['x'.repeat(100), 'x'.repeat(100)],
      ['x'.repeat(101), 'x'.repeat(97) + '...']
   ];

   it.each(cases)('#mask should mask "%s" to "%s"', (value, pattern) => {
      expect(PatternMasker.mask(value)).toBe(pattern);
   });

   it.each(cases)('#mask should not change pattern of "%s" when masked again', value => {
      const pattern = PatternMasker.mask(value);
      expect(PatternMasker.mask(pattern)).toBe(pattern);
   });

   it('#mask should mask only first characters of long value', () => {

      // given
      const value = 'x '.repeat(500) + '123';

      // when
      const pattern = PatternMasker.mask(value);

      // then
      expect(pattern).toBe('x '.repeat(48) + 'x...');
   });

   it('#mask should mask numbers and booleans', () => {
      expect(PatternMasker.mask(42)).toBe('<*>');
      expect(PatternMasker.mask(true)).toBe('true');
   });

   it('#mask should mask valid date', () => {
      expect(PatternMasker.mask(new Date(0))).toBe('<*>:<*>:<*>');
   });

   it.each([undefined, null, '', '  ', new Date(NaN), {}, ['a']])('#mask should return undefined for %s', value => {
      expect(PatternMasker.mask(value)).toBeUndefined();
   });

   it.each(['x'.repeat(100_000), 'x.'.repeat(50_000)])('#mask should cut input to limit before masking', value => {

      // given
      const start = performance.now();

      // when
      PatternMasker.mask(value);

      // then
      expect(performance.now() - start).toBeLessThan(50);
   });

   it.each(['Request <*> failed', '/api/users/<*>', 'say "<*>"', 'code:<*>', '<*> 処理完了'])('#isInformative should accept "%s"',
      pattern => {
         expect(PatternMasker.isInformative(pattern)).toBe(true);
      });

   it.each(['<*>', '<*>:<*>', '<*> <*>:<*>:<*>', 'ERROR', undefined])('#isInformative should reject "%s"', pattern => {
      expect(PatternMasker.isInformative(pattern)).toBe(false);
   });

   it.each([
      [[]],
      [['', ' ', null]],
      [['node-1', 'node-7', 'web01']],
      [['2.4.0', '2.4.1']],
      [['INFO', 'WARN', 'ERROR']],
      [['3f2b8c1e-0a4d-4c6e-9b1a-2d3e4f5a6b7c']],
      [['2024-01-01 10:00:00', '2024-01-02T11:00:00Z']]
   ])('#suits should reject %j', values => {
      expect(PatternMasker.suits(values)).toBe(false);
   });

   it('#suits should accept messages', () => {
      expect(PatternMasker.suits(['Request r1 failed', 'Cache cleared', 'User u7 logged in'])).toBe(true);
   });

   it('#suits should accept one informative value out of ten', () => {
      expect(PatternMasker.suits(['Request r1 failed', ...Array(9).fill('Cache cleared')])).toBe(true);
   });

   it('#suits should reject one informative value out of eleven', () => {
      expect(PatternMasker.suits(['Request r1 failed', ...Array(10).fill('Cache cleared')])).toBe(false);
   });

   it('#suits should not count blank and object values', () => {
      expect(PatternMasker.suits(['Request r1 failed', ...Array(9).fill('Cache cleared'), '', null, {}])).toBe(true);
   });

   it('#suitsColumn should read values of column', () => {

      // given
      const entries = [{ Host: 'node-1', Message: 'Request r1 failed' }, { Host: 'node-2', Message: 'Request r2 failed' }];

      // when
      const suits = [PatternMasker.suitsColumn(entries, 'Host'), PatternMasker.suitsColumn(entries, 'Message')];

      // then
      expect(suits).toEqual([false, true]);
   });
});
