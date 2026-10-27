import { LogPatternDetector } from './log-pattern-detector';
import { FALLBACK_LOG_PATTERN, LOG_PATTERNS } from './log-patterns';

describe('LogPatternDetector', () => {

   const LOGBACK_LINES = [
      '2024-01-01 10:00:00.123 [main] INFO  c.x.App - started',
      '2024-01-01 10:00:01.456 [http-1] ERROR c.x.Auth - Request failed',
      'java.lang.IllegalStateException: boom',
      '\tat c.x.Auth.login(Auth.java:12)',
      'Caused by: java.io.IOException: reset',
      'Caused by: java.net.SocketException: closed',
      'Caused by: java.lang.Error: low level'
   ];

   it.each([
      [LOG_PATTERNS[0], ['2024-01-01 10:00:00,123 ERROR [main] c.x.Auth - failed']],
      [LOG_PATTERNS[1], ['2024-01-01 10:00:00.123 [main] INFO  c.x.Auth - started']],
      [LOG_PATTERNS[2], ['2024-01-01 10:00:00,123 - app.auth - WARNING - slow']],
      [LOG_PATTERNS[3], ['ERROR:app.auth:failed']],
      [LOG_PATTERNS[4], ['2024-01-01T10:00:00.123456+01:00 node-7 sshd[123]: accepted']],
      [LOG_PATTERNS[5], ['2024-01-01 10:00:00 INFO ready']],
      [LOG_PATTERNS[6], ['{"level":"INFO"}']],
      [LOG_PATTERNS[7], ['level=info msg=ready']]
   ])('#detect should detect %s', (expected, lines) => {
      expect(LogPatternDetector.detect(lines)).toBe(expected);
   });

   it('#detect should prefer pattern matching most lines', () => {

      // given
      const lines = ['level=info msg=a', 'level=info msg=b', '{"level":"INFO"}'];

      // when
      const pattern = LogPatternDetector.detect(lines);

      // then
      expect(pattern).toBe(LOG_PATTERNS[7]);
   });

   it('#detect should prefer earlier preset when presets match equally many lines', () => {

      // given
      const lines = ['2024-01-01 10:00:00,123 ERROR [main] c.x.Auth - failed'];

      // when
      const pattern = LogPatternDetector.detect(lines);

      // then
      expect(pattern).toBe(LOG_PATTERNS[0]);
   });

   it('#detect should fall back to message pattern for free text', () => {
      expect(LogPatternDetector.detect(['just some text', 'and more'])).toBe(FALLBACK_LOG_PATTERN);
   });

   it('#detect should detect logback file with Caused-by lines as logback', () => {
      expect(LogPatternDetector.detect(LOGBACK_LINES)).toBe(LOG_PATTERNS[1]);
   });

   it('#detect should not detect logback file with Caused-by lines as level, logger and message pattern', () => {
      expect(LogPatternDetector.detect(LOGBACK_LINES)).not.toBe('{Level:level}:{Logger}:{Message}');
   });
});
