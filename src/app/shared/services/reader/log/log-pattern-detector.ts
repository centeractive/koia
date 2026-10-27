import { DEFAULT_LANGUAGE } from '../../language/language';
import { LinePattern } from './line-pattern';
import { LogLevels } from './log-levels';
import { FALLBACK_LOG_PATTERN, LOG_PATTERNS } from './log-patterns';

export class LogPatternDetector {

   /**
    * @returns the preset matching most of the lines, the earlier preset on equal match counts, or the fallback pattern
    * when no preset matches any line
    */
   static detect(lines: string[], levelNames: string[] = LogLevels.namesOf(DEFAULT_LANGUAGE)): string {
      let detected = FALLBACK_LOG_PATTERN;
      let maxMatches = 0;
      for (const template of LOG_PATTERNS) {
         const pattern = new LinePattern(template, levelNames);
         const matches = lines.filter(line => pattern.match(line)).length;
         if (matches > maxMatches) {
            detected = template;
            maxMatches = matches;
         }
      }
      return detected;
   }
}
