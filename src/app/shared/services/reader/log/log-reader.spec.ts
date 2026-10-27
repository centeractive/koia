import { DataType } from 'app/shared/model';
import { LanguageService } from 'app/shared/services/language';
import { DataHandlerRecorder } from 'app/shared/test';
import { LogLineReader } from './log-line-reader';
import { LogReader } from './log-reader';
import { FALLBACK_LOG_PATTERN, LOG_PATTERNS } from './log-patterns';

describe('LogReader', () => {

   const LOGBACK = '{Time:time} [{Thread}] {Level:level} {Logger} - {Message}';
   const LINES = [
      '2024-01-01 10:00:00.123 [main] INFO  c.x.App - started',
      '2024-01-01 10:00:01.456 [http-1] ERROR c.x.Auth - Request failed',
      'java.lang.IllegalStateException: boom',
      '\tat c.x.Auth.login(Auth.java:12)',
      '2024-01-01 10:00:02.789 [main] WARN  c.x.App - slow'
   ];
   const ENTRIES = [
      { Time: '2024-01-01 10:00:00.123', Thread: 'main', Level: 'INFO', Logger: 'c.x.App', Message: 'started' },
      {
         Time: '2024-01-01 10:00:01.456', Thread: 'http-1', Level: 'ERROR', Logger: 'c.x.Auth',
         Message: 'Request failed\njava.lang.IllegalStateException: boom\n\tat c.x.Auth.login(Auth.java:12)'
      },
      { Time: '2024-01-01 10:00:02.789', Thread: 'main', Level: 'WARN', Logger: 'c.x.App', Message: 'slow' }
   ];
   let reader: LogReader;

   beforeEach(() => {
      reader = new LogReader();
   });

   function logFile(lines = LINES): File {
      return new File([lines.join('\n') + '\n'], 'server.log');
   }

   function usePattern(template: string): void {
      reader.furnishAttributes('')[0].value = template;
   }

   it('should describe log source', () => {
      expect(reader.getSourceName()).toBe('Log');
      expect(reader.getFileExtension()).toBe('.log');
      expect(reader.getDescription()).toBe('Plain-text log file, one entry per line');
      expect(reader.expectsPlainTextData()).toBe(true);
      expect(reader.supportsEncoding()).toBe(true);
   });

   it('#furnishAttributes should provide wide line pattern attribute with presets as choice', () => {

      // when
      const attributes = reader.furnishAttributes('');

      // then
      expect(attributes.length).toBe(1);
      expect(LanguageService.instant(attributes[0].name)).toBe('Line pattern');
      expect(LanguageService.instant(attributes[0].description)).not.toBe(attributes[0].description);
      expect(attributes[0].dataType).toBe(DataType.TEXT);
      expect(attributes[0].wide).toBe(true);
      expect(attributes[0].value).toBe(FALLBACK_LOG_PATTERN);
      expect(attributes[0].valueChoice).toEqual(LOG_PATTERNS);
   });

   it('#furnishAttributes should detect line pattern of header', () => {

      // when
      const attributes = reader.furnishAttributes(LINES.join('\n') + '\n2024-01-01 10:00');

      // then
      expect(attributes[0].value).toBe(LOGBACK);
   });

   it('#furnishAttributes should keep edited line pattern when header is empty', () => {

      // given
      usePattern('{Level} {Message}');

      // when
      const attributes = reader.furnishAttributes('');

      // then
      expect(attributes[0].value).toBe('{Level} {Message}');
   });

   it('#readSample should return entries with their continuation lines', async () => {

      // given
      usePattern(LOGBACK);

      // when
      const sample = await reader.readSample(logFile(), 10, 'UTF-8');

      // then
      expect(sample.entries).toEqual(ENTRIES);
   });

   it('#readSample with an early stop returns exactly count entries', async () => {

      // given
      usePattern(LOGBACK);

      // when
      const sample = await reader.readSample(logFile(), 2, 'UTF-8');

      // then
      expect(sample.entries).toEqual(ENTRIES.slice(0, 2));
   });

   it('#readSample should reject with translated reason when line pattern is invalid', async () => {

      // given
      usePattern('{Level}{Message}');

      // when
      const result = reader.readSample(logFile(), 2, 'UTF-8');

      // then
      await expect(result).rejects.toBe('invalid line pattern: two placeholders need text between them');
   });

   it('#readData should pass entries in chunks and complete', async () => {

      // given
      usePattern(LOGBACK);
      const recorder = new DataHandlerRecorder();
      const onEntriesSpy = vi.spyOn(recorder, 'onEntries');

      // when
      reader.readData(logFile(), 2, recorder, 'UTF-8');
      await recorder.completion;

      // then
      expect(recorder.entries).toEqual(ENTRIES);
      expect(onEntriesSpy.mock.calls.map(c => c[0].length)).toEqual([2, 1]);
   });

   it('#readData should pass no last chunk when entries fill chunks exactly', async () => {

      // given
      usePattern(LOGBACK);
      const recorder = new DataHandlerRecorder();
      const onEntriesSpy = vi.spyOn(recorder, 'onEntries');

      // when
      reader.readData(logFile(), 3, recorder, 'UTF-8');
      await recorder.completion;

      // then
      expect(onEntriesSpy.mock.calls.map(c => c[0].length)).toEqual([3]);
   });

   it('#readData should pass no more entries but complete when canceled', async () => {

      // given
      usePattern(LOGBACK);
      const recorder = new DataHandlerRecorder();
      vi.spyOn(recorder, 'isCanceled').mockReturnValue(true);

      // when
      reader.readData(logFile(), 1, recorder, 'UTF-8');
      await recorder.completion;

      // then
      expect(recorder.entries).toEqual([]);
   });

   it('#readData should stop passing entries when canceled while reading', async () => {

      // given
      usePattern(LOGBACK);
      const recorder = new DataHandlerRecorder();
      const isCanceledSpy = vi.spyOn(recorder, 'isCanceled').mockReturnValue(false);
      vi.spyOn(recorder, 'onEntries').mockImplementation(entries => {
         recorder.entries.push(...entries);
         isCanceledSpy.mockReturnValue(true);
      });

      // when
      reader.readData(logFile(), 1, recorder, 'UTF-8');
      await recorder.completion;

      // then
      expect(recorder.entries).toEqual(ENTRIES.slice(0, 1));
   });

   it('#readData should pass translated reason to error handler when line pattern is invalid', async () => {

      // given
      usePattern('{Message} {Message}');
      const recorder = new DataHandlerRecorder();

      // when
      reader.readData(logFile(), 2, recorder, 'UTF-8');

      // then
      await expect(recorder.completion).rejects.toBe('invalid line pattern: placeholder Message occurs twice');
   });

   it('#readData should pass read error to error handler', async () => {

      // given
      const lineReader = new LogLineReader();
      vi.spyOn(lineReader, 'read').mockRejectedValue('read error');
      reader = new LogReader(lineReader);
      const recorder = new DataHandlerRecorder();

      // when
      reader.readData(logFile(), 2, recorder, 'UTF-8');

      // then
      await expect(recorder.completion).rejects.toBe('read error');
   });

   it.each([
      'scene.reader.logPatternNoPlaceholder',
      'scene.reader.logPatternDuplicateName',
      'scene.reader.logPatternUnclosed',
      'scene.reader.logPatternEmptyName',
      'scene.reader.logPatternAdjacent',
      'scene.reader.logPatternUnknownKind'
   ])('reason %s should be translated', key => {
      expect(LanguageService.instant(key)).not.toBe(key);
   });
});
