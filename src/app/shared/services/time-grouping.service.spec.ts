import { TimeGroupingService } from './time-grouping.service';
import { DatePipe } from '@angular/common';
import { IDataFrame, DataFrame } from 'data-forge';
import { Column, DataType, TimeUnit } from '../model';

describe('TimeGroupingService', () => {

   const datePipe = new DatePipe('en-US');
   const timeColumn: Column = { name: 'Date/Time', dataType: DataType.TIME, width: 10 };
   let now: number;
   let baseDataFrame: IDataFrame<number, any>;
   const service = new TimeGroupingService();

   beforeAll(() => {
      now = new Date().getTime();
      baseDataFrame = new DataFrame([
         { ID: 0, 'Date/Time': undefined, Level: 'ERROR', Data: 'zero', Amount: 0 },
         { ID: 1, 'Date/Time': now - 5000, Level: 'INFO', Data: 'one', Amount: 8 },
         { ID: 2, 'Date/Time': now - 4000, Level: 'INFO', Data: 'two', Amount: 13 },
         { ID: 3, 'Date/Time': now - 3000, Level: 'INFO', Data: 'three', Amount: 20 },
         { ID: 4, 'Date/Time': now - 2000, Level: 'WARN', Data: 'four', Amount: 22 },
         { ID: 5, 'Date/Time': now - 1000, Level: 'WARN', Data: 'fife', Amount: 29 },
         { ID: 6, Level: 'ERROR', Data: 'six', Amount: 33 }
      ]);
   });

   it('#groupByTimeUnit should return base dataframe when time column does not exist', () => {

      // given
      timeColumn.groupingTimeUnit = TimeUnit.YEAR;
      const noTimeBaseDataFrame = new DataFrame([
         { ID: 1, Level: 'INFO', Data: 'one', Amount: 8 },
         { ID: 2, Level: 'INFO', Data: 'two', Amount: 13 },
         { ID: 3, Level: 'INFO', Data: 'three', Amount: 20 },
         { ID: 4, Level: 'WARN', Data: 'four', Amount: 22 },
         { ID: 5, Level: 'WARN', Data: 'fife', Amount: 29 }
      ]);

      // when
      const dataFrame = service.groupByTimeUnit(noTimeBaseDataFrame, timeColumn);

      // then
      expect(dataFrame).toBe(noTimeBaseDataFrame);
   });

   it('#groupByTimeUnit should return base dataframe when timeunit is null', () => {

      // given
      timeColumn.groupingTimeUnit = null;

      // when
      const dataFrame = service.groupByTimeUnit(baseDataFrame, timeColumn);

      // then
      expect(dataFrame).toBe(baseDataFrame);
   });

   it('#groupByTimeUnit should return base dataframe when timeunit is undefined', () => {

      // given
      timeColumn.groupingTimeUnit = undefined;

      // when
      const dataFrame = service.groupByTimeUnit(baseDataFrame, timeColumn);

      // then
      expect(dataFrame).toBe(baseDataFrame);
   });

   it('#groupByTimeUnit should not group when time unit is millisecond', () => {

      // given
      timeColumn.groupingTimeUnit = TimeUnit.MILLISECOND;

      // when
      const dataFrame = service.groupByTimeUnit(baseDataFrame, timeColumn);

      // then
      const expectedData = [
         { ID: 0, Level: 'ERROR', Data: 'zero', Amount: 0, 'Date/Time': undefined },
         { ID: 1, Level: 'INFO', Data: 'one', Amount: 8, 'Date/Time': now - 5000 },
         { ID: 2, Level: 'INFO', Data: 'two', Amount: 13, 'Date/Time': now - 4000 },
         { ID: 3, Level: 'INFO', Data: 'three', Amount: 20, 'Date/Time': now - 3000 },
         { ID: 4, Level: 'WARN', Data: 'four', Amount: 22, 'Date/Time': now - 2000 },
         { ID: 5, Level: 'WARN', Data: 'fife', Amount: 29, 'Date/Time': now - 1000 },
         { ID: 6, Level: 'ERROR', Data: 'six', Amount: 33, 'Date/Time': undefined }
      ]
      expect(dataFrame.toArray()).toEqual(expectedData);
   });

   it('#groupByTimeUnit should group date/time by year', () => {

      // given
      timeColumn.groupingTimeUnit = TimeUnit.YEAR;

      // when
      const dataFrame = service.groupByTimeUnit(baseDataFrame, timeColumn);

      // then
      const year = yearStartMs();
      const expectedData = [
         { ID: 0, Level: 'ERROR', Data: 'zero', Amount: 0, 'Date/Time (per year)': undefined },
         { ID: 1, Level: 'INFO', Data: 'one', Amount: 8, 'Date/Time (per year)': year },
         { ID: 2, Level: 'INFO', Data: 'two', Amount: 13, 'Date/Time (per year)': year },
         { ID: 3, Level: 'INFO', Data: 'three', Amount: 20, 'Date/Time (per year)': year },
         { ID: 4, Level: 'WARN', Data: 'four', Amount: 22, 'Date/Time (per year)': year },
         { ID: 5, Level: 'WARN', Data: 'fife', Amount: 29, 'Date/Time (per year)': year },
         { ID: 6, Level: 'ERROR', Data: 'six', Amount: 33, 'Date/Time (per year)': undefined }
      ]
      expect(dataFrame.toArray()).toEqual(expectedData);
   });

   it('#groupByTimeUnit should group date/time by day', () => {

      // given
      timeColumn.groupingTimeUnit = TimeUnit.DAY;

      // when
      const dataFrame = service.groupByTimeUnit(baseDataFrame, timeColumn);

      // then
      const day = dayStartMs();
      const expectedData = [
         { ID: 0, Level: 'ERROR', Data: 'zero', Amount: 0, 'Date/Time (per day)': undefined },
         { ID: 1, Level: 'INFO', Data: 'one', Amount: 8, 'Date/Time (per day)': day },
         { ID: 2, Level: 'INFO', Data: 'two', Amount: 13, 'Date/Time (per day)': day },
         { ID: 3, Level: 'INFO', Data: 'three', Amount: 20, 'Date/Time (per day)': day },
         { ID: 4, Level: 'WARN', Data: 'four', Amount: 22, 'Date/Time (per day)': day },
         { ID: 5, Level: 'WARN', Data: 'fife', Amount: 29, 'Date/Time (per day)': day },
         { ID: 6, Level: 'ERROR', Data: 'six', Amount: 33, 'Date/Time (per day)': undefined }
      ]
      expect(dataFrame.toArray()).toEqual(expectedData);
   });

   it('#groupByFormattedTimeUnit should return base dataframe when date/time column does not exist', () => {

      // given
      timeColumn.groupingTimeUnit = TimeUnit.YEAR;

      // given
      const noTimeBaseDataFrame = new DataFrame([
         { ID: 1, Level: 'INFO', Data: 'one', Amount: 8 },
         { ID: 2, Level: 'INFO', Data: 'two', Amount: 13 },
         { ID: 3, Level: 'INFO', Data: 'three', Amount: 20 },
         { ID: 4, Level: 'WARN', Data: 'four', Amount: 22 },
         { ID: 5, Level: 'WARN', Data: 'fife', Amount: 29 }
      ]);

      // when
      const dataFrame = service.groupByFormattedTimeUnit(noTimeBaseDataFrame, timeColumn);

      // then
      expect(dataFrame).toBe(noTimeBaseDataFrame);
   });

   it('#groupByFormattedTimeUnit should return base dataframe when timeunit is null', () => {

      // given
      timeColumn.groupingTimeUnit = null;

      // when
      const dataFrame = service.groupByFormattedTimeUnit(baseDataFrame, timeColumn);

      // then
      expect(dataFrame).toBe(baseDataFrame);
   });

   it('#groupByFormattedTimeUnit should return base dataframe when timeunit is undefined', () => {

      // given
      timeColumn.groupingTimeUnit = undefined;

      // when
      const dataFrame = service.groupByFormattedTimeUnit(baseDataFrame, timeColumn);

      // then
      expect(dataFrame).toBe(baseDataFrame);
   });

   it('#groupByFormattedTimeUnit should not group but format time when time unit is millisecond', () => {

      // given
      timeColumn.groupingTimeUnit = TimeUnit.MILLISECOND;

      // when
      const dataFrame = service.groupByFormattedTimeUnit(baseDataFrame, timeColumn);

      // then
      const format = 'd MMM yyyy HH:mm:ss SSS';
      const expectedData = [
         { ID: 0, Level: 'ERROR', Data: 'zero', Amount: 0, 'Date/Time': 'empty' },
         { ID: 1, Level: 'INFO', Data: 'one', Amount: 8, 'Date/Time': datePipe.transform(now - 5000, format) },
         { ID: 2, Level: 'INFO', Data: 'two', Amount: 13, 'Date/Time': datePipe.transform(now - 4000, format) },
         { ID: 3, Level: 'INFO', Data: 'three', Amount: 20, 'Date/Time': datePipe.transform(now - 3000, format) },
         { ID: 4, Level: 'WARN', Data: 'four', Amount: 22, 'Date/Time': datePipe.transform(now - 2000, format) },
         { ID: 5, Level: 'WARN', Data: 'fife', Amount: 29, 'Date/Time': datePipe.transform(now - 1000, format) },
         { ID: 6, Level: 'ERROR', Data: 'six', Amount: 33, 'Date/Time': 'empty' }
      ]
      expect(dataFrame.toArray()).toEqual(expectedData);
   });

   it('#groupByFormattedTimeUnit should group date/time by year', () => {

      // given
      timeColumn.groupingTimeUnit = TimeUnit.YEAR;

      // when
      const dataFrame = service.groupByFormattedTimeUnit(baseDataFrame, timeColumn);

      // then
      const year = datePipe.transform(now, 'yyyy');
      const expectedData = [
         { ID: 0, Level: 'ERROR', Data: 'zero', Amount: 0, 'Date/Time (per year)': 'empty' },
         { ID: 1, Level: 'INFO', Data: 'one', Amount: 8, 'Date/Time (per year)': year },
         { ID: 2, Level: 'INFO', Data: 'two', Amount: 13, 'Date/Time (per year)': year },
         { ID: 3, Level: 'INFO', Data: 'three', Amount: 20, 'Date/Time (per year)': year },
         { ID: 4, Level: 'WARN', Data: 'four', Amount: 22, 'Date/Time (per year)': year },
         { ID: 5, Level: 'WARN', Data: 'fife', Amount: 29, 'Date/Time (per year)': year },
         { ID: 6, Level: 'ERROR', Data: 'six', Amount: 33, 'Date/Time (per year)': 'empty' }
      ]
      expect(dataFrame.toArray()).toEqual(expectedData);
   });

   it('#groupByFormattedTimeUnit should group date/time by day', () => {

      // given
      timeColumn.groupingTimeUnit = TimeUnit.DAY;

      // when
      const dataFrame = service.groupByFormattedTimeUnit(baseDataFrame, timeColumn);

      // then
      const day = datePipe.transform(now, 'd MMM yyyy');
      const expectedData = [
         { ID: 0, Level: 'ERROR', Data: 'zero', Amount: 0, 'Date/Time (per day)': 'empty' },
         { ID: 1, Level: 'INFO', Data: 'one', Amount: 8, 'Date/Time (per day)': day },
         { ID: 2, Level: 'INFO', Data: 'two', Amount: 13, 'Date/Time (per day)': day },
         { ID: 3, Level: 'INFO', Data: 'three', Amount: 20, 'Date/Time (per day)': day },
         { ID: 4, Level: 'WARN', Data: 'four', Amount: 22, 'Date/Time (per day)': day },
         { ID: 5, Level: 'WARN', Data: 'fife', Amount: 29, 'Date/Time (per day)': day },
         { ID: 6, Level: 'ERROR', Data: 'six', Amount: 33, 'Date/Time (per day)': 'empty' }
      ]
      expect(dataFrame.toArray()).toEqual(expectedData);
   });

   function yearStartMs(): number {
      const year = new Date(now);
      year.setMonth(0);
      year.setDate(1);
      year.setHours(0);
      year.setMinutes(0);
      year.setSeconds(0);
      year.setMilliseconds(0);
      return year.getTime();
   }

   function dayStartMs(): number {
      const day = new Date(now);
      day.setHours(0);
      day.setMinutes(0);
      day.setSeconds(0);
      day.setMilliseconds(0);
      return day.getTime();
   }
});
