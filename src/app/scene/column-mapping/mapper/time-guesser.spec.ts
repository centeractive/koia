import { TimeGuesser } from './time-guesser';
import { ColumnPair, DataType } from 'app/shared/model';

describe('TimeGuesser', () => {

   const timeGuesser = new TimeGuesser();

   it('#isAssumedlyTime should return false when value is not defined', () => {
      expect(timeGuesser.isAssumedlyTime(columnPair('time'), undefined)).toBe(false);
      expect(timeGuesser.isAssumedlyTime(columnPair('time'), null)).toBe(false);
   });

   it('#isAssumedlyTime should return false when value is a float', () => {
      expect(timeGuesser.isAssumedlyTime(columnPair('time'), -1.1)).toBe(false);
      expect(timeGuesser.isAssumedlyTime(columnPair('time'), -0.1)).toBe(false);
      expect(timeGuesser.isAssumedlyTime(columnPair('time'), 0.1)).toBe(false);
      expect(timeGuesser.isAssumedlyTime(columnPair('time'), 1.1)).toBe(false);
   });

   it('#isAssumedlyTime should return true when column name indicates time', () => {
      const value = thousandYearsAgo();
      expect(timeGuesser.isAssumedlyTime(columnPair('time'), value)).toBe(true);
      expect(timeGuesser.isAssumedlyTime(columnPair('creation time'), value)).toBe(true);
      expect(timeGuesser.isAssumedlyTime(columnPair('starttime'), value)).toBe(true);
      expect(timeGuesser.isAssumedlyTime(columnPair('updated'), value)).toBe(true);
      expect(timeGuesser.isAssumedlyTime(columnPair('created'), value)).toBe(true);
      expect(timeGuesser.isAssumedlyTime(columnPair('Time'), value)).toBe(true);
      expect(timeGuesser.isAssumedlyTime(columnPair('Creation Time'), value)).toBe(true);
      expect(timeGuesser.isAssumedlyTime(columnPair('Starttime'), value)).toBe(true);
      expect(timeGuesser.isAssumedlyTime(columnPair('Updated'), value)).toBe(true);
      expect(timeGuesser.isAssumedlyTime(columnPair('Created'), value)).toBe(true);
   });

   it('#isAssumedlyTime should return false when column name does not indicates time', () => {
      const value = thousandYearsAgo();
      expect(timeGuesser.isAssumedlyTime(columnPair('x'), value)).toBe(false);
      expect(timeGuesser.isAssumedlyTime(columnPair('time-difference'), value)).toBe(false);
   });

   it('#isAssumedlyTime should return false when time is before past ten years', () => {
      expect(timeGuesser.isAssumedlyTime(columnPair('x'), tenYearsAgo() - 1000)).toBe(false);
   });

   it('#isAssumedlyTime should return false when time is after future ten years', () => {
      expect(timeGuesser.isAssumedlyTime(columnPair('x'), tenYearsAhead() + 1000)).toBe(false);
   });

   it('#isAssumedlyTime should return true when time is within passed and future ten years', () => {
      expect(timeGuesser.isAssumedlyTime(columnPair('x'), tenYearsAgo())).toBe(true);
      expect(timeGuesser.isAssumedlyTime(columnPair('x'), tenYearsAgo() + 1000)).toBe(true);
      expect(timeGuesser.isAssumedlyTime(columnPair('x'), tenYearsAhead() - 1000)).toBe(true);
      expect(timeGuesser.isAssumedlyTime(columnPair('x'), tenYearsAhead())).toBe(true);
   });

   function columnPair(columnName: string): ColumnPair {
      return {
         source: { name: columnName, dataType: DataType.NUMBER, width: 10 },
         target: { name: columnName, dataType: DataType.NUMBER, width: 10 }
      };
   }

   function thousandYearsAgo(): number {
      const date = new Date();
      return date.setFullYear(date.getFullYear() - 1000);
   }

   function tenYearsAgo(): number {
      const date = new Date();
      return date.setFullYear(date.getFullYear() - 10);
   }

   function tenYearsAhead(): number {
      const date = new Date();
      return date.setFullYear(date.getFullYear() + 10);
   }
});
