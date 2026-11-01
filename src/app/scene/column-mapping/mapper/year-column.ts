import { ColumnPair, DataType, TimeUnit } from 'app/shared/model';
import { DateTimeUtils, StringUtils } from 'app/shared/utils';

/**
 * a number column of years, mapped to time by parsing its values with the year source format
 */
export class YearColumn {

   static readonly SOURCE_FORMAT = 'y';

   private static readonly WORD_ENDINGS = ['year', 'jahr'];
   private static readonly WORDS = ['année', 'annee', 'anno', 'año'];
   private static readonly YEAR_STRING = /^\d{1,4}$/;
   private static readonly MAX_YEAR = 9999;

   /**
    * @returns whether a word of the name ends like year or Jahr, or is a year in French, Italian or Spanish
    */
   static isYearName(name: string): boolean {
      return name.toLowerCase().split(/[^\p{L}]+/u).some(word =>
         YearColumn.WORD_ENDINGS.some(ending => word.endsWith(ending)) || YearColumn.WORDS.includes(word));
   }

   /**
    * @returns whether values are present and all of them are integers from 1 to 9999
    */
   static hasYearValues(values: unknown[]): boolean {
      const present = values.filter(v => !StringUtils.isBlank(v));
      return present.length > 0 && present.every(v => YearColumn.isYear(v));
   }

   static apply(columnPair: ColumnPair): void {
      columnPair.source.format = YearColumn.SOURCE_FORMAT;
      columnPair.target.dataType = DataType.TIME;
      columnPair.target.format = DateTimeUtils.ngFormatOf(TimeUnit.YEAR);
   }

   private static isYear(value: unknown): boolean {
      if (typeof value === 'number') {
         return Number.isInteger(value) && value >= 1 && value <= YearColumn.MAX_YEAR;
      }
      return typeof value === 'string' && YearColumn.YEAR_STRING.test(value) && Number(value) >= 1;
   }
}
