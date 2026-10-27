import { Attribute, DataType } from 'app/shared/model';
import { LanguageService } from '../../language';
import { DataHandler } from '../data-handler.type';
import { DataReader } from '../data-reader.type';
import { HeaderLines } from '../header-lines';
import { Sample } from '../sample.type';
import { SourceName } from '../source-name.enum';
import { LinePattern, LinePatternError } from './line-pattern';
import { LogEntryAssembler } from './log-entry-assembler';
import { LogLineReader } from './log-line-reader';
import { LogPatternDetector } from './log-pattern-detector';
import { FALLBACK_LOG_PATTERN, LOG_PATTERNS } from './log-patterns';

export class LogReader implements DataReader {

   private readonly attrPattern = new Attribute<string>('scene.reader.logPattern', 'scene.reader.logPatternDescription', DataType.TEXT,
      FALLBACK_LOG_PATTERN, true);

   constructor(private readonly lineReader = new LogLineReader()) {
      this.attrPattern.valueChoice = LOG_PATTERNS;
   }

   getDescription(): string {
      return LanguageService.instant('scene.reader.logDescription');
   }

   getSourceName(): string {
      return SourceName.LOG;
   }

   getFileExtension(): string {
      return '.log';
   }

   expectsPlainTextData(): boolean {
      return true;
   }

   supportsEncoding(): boolean {
      return true;
   }

   furnishAttributes(dataHeader: string): Attribute[] {
      const lines = HeaderLines.of(dataHeader);
      if (lines.length > 0) {
         this.attrPattern.value = LogPatternDetector.detect(lines);
      }
      return [this.attrPattern];
   }

   async readSample(file: File, entriesCount: number, encoding?: string): Promise<Sample> {
      const entries: object[] = [];
      const assembler = new LogEntryAssembler(this.pattern(), entry => {
         if (entries.length < entriesCount) {
            entries.push(entry);
         }
         return entries.length < entriesCount;
      });
      await this.lineReader.read(file, encoding, line => assembler.add(line));
      assembler.finish();
      return { entries };
   }

   readData(file: File, chunkSize: number, dataHandler: DataHandler, encoding?: string): void {
      let entries: object[] = [];
      const deliver = (): void => {
         dataHandler.onEntries(entries);
         entries = [];
      };
      try {
         const assembler = new LogEntryAssembler(this.pattern(), entry => {
            entries.push(entry);
            if (entries.length === chunkSize) {
               deliver();
            }
            return true;
         });
         this.lineReader.read(file, encoding, line => !dataHandler.isCanceled() && assembler.add(line))
            .then(() => {
               if (!dataHandler.isCanceled()) {
                  assembler.finish();
                  if (entries.length > 0) {
                     deliver();
                  }
               }
               dataHandler.onComplete();
            })
            .catch(err => dataHandler.onError(err));
      } catch (err) {
         dataHandler.onError(err);
      }
   }

   /**
    * @throws the translated reason when the line pattern is invalid
    */
   private pattern(): LinePattern {
      try {
         return new LinePattern(this.attrPattern.value);
      } catch (err) {
         const error = err as LinePatternError;
         throw LanguageService.instant('scene.reader.logPatternInvalid',
            { reason: LanguageService.instant(error.key, error.params) });
      }
   }
}
