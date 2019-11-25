import { ColumnPair } from 'app/shared/model';
import { NumberUtils } from 'app/shared/utils';

export class TimeGuesser {

   private static readonly YEAR_DIFF = 10;

   /**
    * @returns [[true]] if the specified value is assumed to represent the number of milliseconds
    * that have elapsed since midnight on January 1, 1970, UTC
    */
   isAssumedlyTime(columnPair: ColumnPair, value: number): boolean {
      if (NumberUtils.isInteger(value)) {
         const lowerCaseColName = columnPair.source.name.toLowerCase();
         return lowerCaseColName.endsWith('time') ||
            lowerCaseColName.endsWith('timestamp') ||
            lowerCaseColName === 'updated' ||
            lowerCaseColName === 'created' ||
            this.isTimeWithinTenYearsAroundNow(value);
      }
      return false;
   }

   private isTimeWithinTenYearsAroundNow(value: number): boolean {
      let now = new Date();
      if (value < now.setFullYear(now.getFullYear() - TimeGuesser.YEAR_DIFF)) {
         return false;
      }
      now = new Date();
      return value <= now.setFullYear(now.getFullYear() + TimeGuesser.YEAR_DIFF);
   }
}
