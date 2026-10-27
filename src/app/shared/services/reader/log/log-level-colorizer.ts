import { ColumnPair } from 'app/shared/model';
import { QueryConverter } from '../../backend/mango/query-converter';
import { Language } from '../../language/language';
import { LogLevels } from './log-levels';

/**
 * gives entries the background color of their log level, as the Retrospective Log Analyzer does when it exports highlighted entries
 */
export class LogLevelColorizer {

   private constructor(private readonly levelColumn: string, private readonly language: Language) { }

   /**
    * @param levelColumn the source column that holds log levels
    * @returns undefined when the log level column is not mapped or when the data has its own color columns
    */
   static of(columnMappings: ColumnPair[], levelColumn: string | undefined, language: Language): LogLevelColorizer | undefined {
      const mappings = columnMappings.filter(cp => !cp.skip);
      const levelMapping = mappings.find(cp => !cp.target.patternOf && cp.source.name === levelColumn);
      if (!levelMapping || mappings.some(cp => QueryConverter.TABLE_STYLE_FIELDS.includes(cp.target.name))) {
         return undefined;
      }
      return new LogLevelColorizer(levelMapping.target.name, language);
   }

   colorize(entry: object): void {
      const category = LogLevels.categoryOf(entry[this.levelColumn], this.language);
      const bgColor = category && LogLevels.bgColorOf(category);
      if (bgColor) {
         entry[QueryConverter.BG_COLOR] = bgColor;
      }
   }
}
