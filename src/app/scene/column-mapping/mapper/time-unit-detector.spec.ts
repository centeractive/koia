import { TimeUnitDetector } from './time-unit-detector';
import { ColumnPair, DataType, TimeUnit } from 'app/shared/model';

describe('TimeUnitDetector', () => {

   const detector = new TimeUnitDetector();

   it('#fromColumnName should return default time unit when value is not an integer', () => {
      const timeUnit = detector.fromColumnName(columnPair('x'), 1.1, TimeUnit.DAY);

      expect(timeUnit).toBe(TimeUnit.DAY);
   });

   it('#fromColumnName should return default time unit when no match found ', () => {
      const timeUnit = detector.fromColumnName(columnPair('x'), 1, TimeUnit.SECOND);

      expect(timeUnit).toBe(TimeUnit.SECOND);
   });

   it('#fromColumnName should return MILLISECOND when "timestamp" found ', () => {
      const timeUnit = detector.fromColumnName(columnPair('Timestamp'), 1, TimeUnit.DAY);

      expect(timeUnit).toBe(TimeUnit.MILLISECOND);
   });

   it('#fromColumnName should return MILLISECOND when "millisecond" found ', () => {
      const timeUnit = detector.fromColumnName(columnPair('millisecond'), 1, TimeUnit.DAY);

      expect(timeUnit).toBe(TimeUnit.MILLISECOND);
   });

   it('#fromColumnName should return SECOND when match found ', () => {
      const timeUnit = detector.fromColumnName(columnPair('Second'), 1, TimeUnit.MONTH);

      expect(timeUnit).toBe(TimeUnit.SECOND);
   });

   it('#fromColumnName should return MINUTE when match found ', () => {
      const timeUnit = detector.fromColumnName(columnPair('Minute'), 1, TimeUnit.YEAR);

      expect(timeUnit).toBe(TimeUnit.MINUTE);
   });

   it('#fromColumnName should return HOUR when match found ', () => {
      const timeUnit = detector.fromColumnName(columnPair('Start Hour'), 1, TimeUnit.YEAR);

      expect(timeUnit).toBe(TimeUnit.HOUR);
   });

   it('#fromColumnName should return DAY when "day" found ', () => {
      const timeUnit = detector.fromColumnName(columnPair('Day of return'), 1, TimeUnit.MINUTE);

      expect(timeUnit).toBe(TimeUnit.DAY);
   });

   it('#fromColumnName should return DAY when "date" found ', () => {
      const timeUnit = detector.fromColumnName(columnPair('shipping date'), 1, TimeUnit.MINUTE);

      expect(timeUnit).toBe(TimeUnit.DAY);
   });

   it('#fromColumnName should return MONTH when match found ', () => {
      const timeUnit = detector.fromColumnName(columnPair('End Month'), 1, TimeUnit.YEAR);

      expect(timeUnit).toBe(TimeUnit.MONTH);
   });

   it('#fromColumnName should return YEAR when match found ', () => {
      const timeUnit = detector.fromColumnName(columnPair('Year of birth'), 1, TimeUnit.MINUTE);

      expect(timeUnit).toBe(TimeUnit.YEAR);
   });

   function columnPair(columnName: string): ColumnPair {
      return {
         source: { name: columnName, dataType: DataType.TIME, width: 10 },
         target: { name: columnName, dataType: DataType.TIME, width: 10 }
      };
   }
});
