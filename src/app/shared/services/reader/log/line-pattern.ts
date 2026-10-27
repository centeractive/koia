import { DEFAULT_LANGUAGE } from '../../language/language';
import { LogLevels } from './log-levels';

/**
 * the reason why a line pattern template is invalid, expressed as translation key with its parameters
 */
export class LinePatternError extends Error {

   constructor(readonly key: string, readonly params?: Record<string, string>) {
      super(key);
   }
}

interface Placeholder {
   name: string;
   kind?: string;
}

type Token = string | Placeholder;

/**
 * splits log lines into named values by a template like "{Time:time} [{Thread}] {Level:level} {Logger} - {Message}"
 */
export class LinePattern {

   static readonly JSON_LINES = '{json}';
   static readonly LOGFMT = '{logfmt}';

   private static readonly TIME = '(\\d{4}-\\d{2}-\\d{2}[T ]\\d{2}:\\d{2}(?::\\d{2})?(?:[.,]\\d{1,9})?(?:Z|[+-]\\d{2}:?\\d{2})?)';
   private static readonly KINDS = ['time', 'level'];
   private static readonly LOGFMT_PAIR = /\s*([\w.-]+)=("(?:[^"\\]|\\.)*"|[^\s"]*)/y;

   readonly continuationName: string | undefined;
   /** the name of the first {Name:level} placeholder */
   readonly levelName: string | undefined;
   private readonly template: string;
   private readonly names: string[] = [];
   private readonly levelRegex: string;
   private readonly regex: RegExp;

   /**
    * @param levelNames the log level names a {Name:level} placeholder matches (case-insensitive)
    * @throws [[LinePatternError]] when the template is invalid
    */
   constructor(template: string, levelNames: string[] = LogLevels.namesOf(DEFAULT_LANGUAGE)) {
      this.template = template.trim();
      this.levelRegex = LinePattern.levelRegexOf(levelNames);
      if (this.template !== LinePattern.JSON_LINES && this.template !== LinePattern.LOGFMT) {
         const tokens = LinePattern.tokenize(this.template);
         const placeholders = LinePattern.placeholdersOf(tokens);
         this.names = placeholders.map(p => p.name);
         this.levelName = placeholders.find(p => p.kind === 'level')?.name;
         this.regex = new RegExp('^' + tokens.map((t, i) => this.regexOf(t, tokens[i + 1])).join('') + '$');
         this.continuationName = this.names[this.names.length - 1];
      }
   }

   /**
    * @returns the values of the line by name, undefined when the line does not match
    */
   match(line: string): Record<string, unknown> | undefined {
      if (this.template === LinePattern.JSON_LINES) {
         return LinePattern.matchJson(line);
      } else if (this.template === LinePattern.LOGFMT) {
         return LinePattern.matchLogfmt(line);
      }
      const groups = this.regex.exec(line);
      return groups ? Object.fromEntries(this.names.map((name, i) => [name, groups[i + 1]])) : undefined;
   }

   private static tokenize(template: string): Token[] {
      const tokens: Token[] = [];
      let literal = '';
      let i = 0;
      while (i < template.length) {
         if (template[i] === '{') {
            const end = template.indexOf('}', i);
            if (end === -1) {
               throw new LinePatternError('scene.reader.logPatternUnclosed');
            }
            if (literal) {
               tokens.push(literal);
               literal = '';
            } else if (tokens.length > 0) {
               throw new LinePatternError('scene.reader.logPatternAdjacent');
            }
            tokens.push(LinePattern.placeholderOf(template.substring(i + 1, end)));
            i = end + 1;
         } else {
            literal += template[i++];
         }
      }
      if (literal) {
         tokens.push(literal);
      }
      return tokens;
   }

   private static placeholderOf(content: string): Placeholder {
      const [name, kind] = content.split(':');
      if (!name) {
         throw new LinePatternError('scene.reader.logPatternEmptyName');
      }
      if (kind !== undefined && !LinePattern.KINDS.includes(kind)) {
         throw new LinePatternError('scene.reader.logPatternUnknownKind', { kind });
      }
      return { name, kind };
   }

   private static placeholdersOf(tokens: Token[]): Placeholder[] {
      const placeholders = tokens.filter(t => typeof t !== 'string');
      if (placeholders.length === 0) {
         throw new LinePatternError('scene.reader.logPatternNoPlaceholder');
      }
      const duplicate = placeholders.find((p, i) => placeholders.findIndex(o => o.name === p.name) !== i);
      if (duplicate) {
         throw new LinePatternError('scene.reader.logPatternDuplicateName', { name: duplicate.name });
      }
      return placeholders;
   }

   private static levelRegexOf(levelNames: string[]): string {
      const caseInsensitive = (c: string): string => c.toUpperCase() === c.toLowerCase() ? c : '[' + c.toUpperCase() + c.toLowerCase() + ']';
      return '(' + levelNames.map(name => name.replace(/./gu, caseInsensitive)).join('|') + ')';
   }

   private regexOf(token: Token, next: Token | undefined): string {
      if (typeof token === 'string') {
         return token.split(/(\s+)/)
            .map(part => /^\s+$/.test(part) ? '\\s+' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('');
      } else if (token.kind === 'time') {
         return LinePattern.TIME;
      } else if (token.kind === 'level') {
         return this.levelRegex;
      } else if (next === undefined) {
         return '(.*)';
      }
      return /^\s/.test(next as string) ? '(\\S+)' : '(.*?)';
   }

   private static matchJson(line: string): Record<string, unknown> | undefined {
      if (line.trimStart().startsWith('{')) {
         try {
            return JSON.parse(line);
         } catch {
            return undefined;
         }
      }
      return undefined;
   }

   private static matchLogfmt(line: string): Record<string, unknown> | undefined {
      const entry: Record<string, unknown> = {};
      const text = line.trimEnd();
      const pair = new RegExp(LinePattern.LOGFMT_PAIR);
      let found = false;
      let groups: RegExpExecArray;
      while (pair.lastIndex < text.length && (groups = pair.exec(text))) {
         const value = groups[2];
         entry[groups[1]] = value.startsWith('"') ? value.slice(1, -1).replace(/\\(.)/g, '$1') : value;
         found = true;
      }
      return found && pair.lastIndex === text.length ? entry : undefined;
   }
}
