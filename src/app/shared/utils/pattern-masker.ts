import { MAX_INDEXED_TEXT_LENGTH } from './column-utils';
import { StringUtils } from './string-utils';

const MASK = '<*>';
const URL = /\b[a-z][a-z0-9+.-]*:\/\/[^\s"'`<>)]+/gi;
const DOUBLE_QUOTED = /"[^"]*"/g;
const BACK_QUOTED = /`[^`]*`/g;
const WHITESPACE_TOKEN = /\S+/g;
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const WORD_TOKEN = /[\w.+#-]+/g;
const DIGIT = /\d/;
const LETTERS_ONLY_HEX = /\b[a-f]{8,}\b/gi;
const WHITESPACE = /\s+/g;
const LETTER = /\p{L}/u;

/**
 * Derives the pattern of a free text value (e.g. a log message) by masking its variable tokens with "<*>", so that
 * values differing only in ids, numbers, addresses, times etc. share the same pattern:
 *
 * - URLs, e-mail addresses, double- and back-quoted strings
 * - tokens containing a digit (numbers, ids like "r10042", versions, UUIDs, durations like "35ms", hosts like "node-7");
 *   "/" and ":" separate tokens, so "/api/users/123" becomes "/api/users/<*>" and "code:500" becomes "code:<*>"
 * - hex words of at least 8 letters (e.g. "deadbeef")
 *
 * Tokens with digits that carry meaning are masked too (e.g. "IPv4", "UTF-8", "OAuth2"). Single quotes are left alone
 * because of apostrophes. Only the first [[MASK_INPUT_LIMIT]] characters are masked, which bounds the cost of the
 * regular expressions, and the pattern is abbreviated to [[MAX_INDEXED_TEXT_LENGTH]] characters, so that a pattern
 * column can always be indexed. A column suits a pattern column when at least [[MIN_INFORMATIVE_SHARE]] of its values have an
 * informative pattern.
 */
export class PatternMasker {

   static readonly MASK_INPUT_LIMIT = 1_000;
   static readonly MIN_INFORMATIVE_SHARE = 0.1;

   /**
    * @returns the pattern of a string, number, boolean or valid date, or undefined for blank and other values
    */
   static mask(value: unknown): string | undefined {
      const text = PatternMasker.textOf(value);
      if (StringUtils.isBlank(text)) {
         return undefined;
      }
      const pattern = text.substring(0, PatternMasker.MASK_INPUT_LIMIT)
         .replace(URL, MASK)
         .replace(DOUBLE_QUOTED, '"' + MASK + '"')
         .replace(BACK_QUOTED, '`' + MASK + '`')
         .replace(WHITESPACE_TOKEN, t => t.includes('@') ? t.replace(EMAIL, MASK) : t)
         .replace(WORD_TOKEN, t => DIGIT.test(t) ? MASK : t)
         .replace(LETTERS_ONLY_HEX, MASK)
         .replace(WHITESPACE, ' ')
         .trim();
      return StringUtils.abbreviate(pattern, MAX_INDEXED_TEXT_LENGTH);
   }

   /**
    * @returns true when variable parts were masked and constant words remain
    */
   static isInformative(pattern: string | undefined): boolean {
      return !!pattern && pattern.includes(MASK) && LETTER.test(pattern.replaceAll(MASK, ''));
   }

   /**
    * @returns true when the values are free text, i.e. enough of their patterns are informative
    */
   static suits(values: unknown[]): boolean {
      const patterns = values.map(v => PatternMasker.mask(v)).filter(p => p !== undefined);
      const informative = patterns.filter(p => PatternMasker.isInformative(p)).length;
      return patterns.length > 0 && informative >= patterns.length * PatternMasker.MIN_INFORMATIVE_SHARE;
   }

   static suitsColumn(entries: object[], name: string): boolean {
      return PatternMasker.suits(entries.map(e => e[name]));
   }

   private static textOf(value: unknown): string | undefined {
      if (typeof value === 'string') {
         return value;
      } else if (typeof value === 'number' || typeof value === 'boolean') {
         return String(value);
      } else if (value instanceof Date && !isNaN(value.getTime())) {
         return value.toISOString();
      }
      return undefined;
   }
}
