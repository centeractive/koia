import { ColumnPair, TimeUnit } from 'app/shared/model';

export class TimeUnitDetector {

   fromColumnName(columnPair: ColumnPair, value: number, defaultTimeUnit: TimeUnit): TimeUnit {
      if (Number.isInteger(value)) {
         const lowerCaseColName = columnPair.source.name.toLowerCase();
         if (lowerCaseColName.includes('millisecond') || lowerCaseColName.includes('time')) {
            return TimeUnit.MILLISECOND;
         } else if (lowerCaseColName.includes('second')) {
            return TimeUnit.SECOND;
         } else if (lowerCaseColName.includes('minute')) {
            return TimeUnit.MINUTE;
         } else if (lowerCaseColName.includes('hour')) {
            return TimeUnit.HOUR;
         } else if (lowerCaseColName.includes('day') || lowerCaseColName.includes('date')) {
            return TimeUnit.DAY;
         } else if (lowerCaseColName.includes('month')) {
            return TimeUnit.MONTH;
         } else if (lowerCaseColName.includes('year')) {
            return TimeUnit.YEAR;
         }
      }
      return defaultTimeUnit;
   }
}
