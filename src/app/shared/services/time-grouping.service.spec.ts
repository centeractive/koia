import { TestBed } from '@angular/core/testing';
import { TimeGroupingService } from './time-grouping.service';
import { LanguageService } from './language/language.service';
import { DatePipe } from '@angular/common';
import { IDataFrame, DataFrame } from 'data-forge';
import { Column, DataType, TimeUnit } from '../model';
import { DateTimeUtils } from '../utils';
import { Settings } from 'luxon';

describe('TimeGroupingService', () => {

   const datePipe = new DatePipe('en-US');
   const timeColumn: Column = { name: 'Date/Time', dataType: DataType.TIME, width: 10 };
   let now: number;
   let baseDataFrame: IDataFrame<number, object>;
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

   it('#groupByFormattedTimeUnit should return base dataframe when time column named constructor does not exist', () => {

      // given
      const df = new DataFrame<number, object>([{ ID: 1 }, { ID: 2 }]);
      const column: Column = { name: 'constructor', dataType: DataType.TIME, width: 10, groupingTimeUnit: TimeUnit.MINUTE };

      // when
      const dataFrame = service.groupByFormattedTimeUnit(df, column);

      // then
      expect(dataFrame).toBe(df);
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

   it('#groupByFormattedTimeUnit should group date/time when time column is missing in first row', () => {

      // given
      timeColumn.groupingTimeUnit = TimeUnit.YEAR;
      const firstRowWithoutTimeDataFrame = new DataFrame([
         { ID: 6, Level: 'ERROR' },
         { ID: 1, 'Date/Time': now - 5000, Level: 'INFO' }
      ]);

      // when
      const dataFrame = service.groupByFormattedTimeUnit(firstRowWithoutTimeDataFrame, timeColumn);

      // then
      const rows = dataFrame.toArray();
      expect(rows[0]['Date/Time (per year)']).toBe('empty');
      expect(rows[1]['Date/Time (per year)']).toBe(datePipe.transform(now, 'yyyy'));
   });

   it('#groupByFormattedTimeUnit should keep column named like the label when grouping under another label', () => {

      // given
      const column: Column = { ...timeColumn, groupingTimeUnit: TimeUnit.DAY };
      const dataFrame = new DataFrame([{ 'Date/Time': now, 'Date/Time (per day)': 'text' }]);

      // when
      const result = service.groupByFormattedTimeUnit(dataFrame, column, 'Date/Time (per day) #');

      // then
      const expected = DateTimeUtils.formatTime(DateTimeUtils.toBaseTime(now, TimeUnit.DAY), TimeUnit.DAY);
      expect(result.toArray()).toEqual([{ 'Date/Time (per day)': 'text', 'Date/Time (per day) #': expected }]);
   });

   describe('when clocks are turned back in Europe/Zurich on 27 Oct 2024 from 03:00 to 02:00', () => {

      beforeEach(() => {
         Settings.defaultZone = 'Europe/Zurich';
      });

      afterEach(() => {
         Settings.defaultZone = null;
      });

      it('#groupByFormattedTimeUnit should label occurrences of hour repeated when clocks are turned back by offset', () => {

         // given
         const column: Column = { ...timeColumn, groupingTimeUnit: TimeUnit.HOUR };
         const dataFrame = new DataFrame([
            { 'Date/Time': Date.UTC(2024, 9, 27, 0, 30, 15, 250) },
            { 'Date/Time': Date.UTC(2024, 9, 27, 1, 30, 15, 250) }
         ]);

         // when
         const result = service.groupByFormattedTimeUnit(dataFrame, column);

         // then
         expect(result.toArray().map(r => r['Date/Time (per hour)'])).toEqual(['27 Oct 2024 02 +02:00', '27 Oct 2024 02 +01:00']);
      });
   });

   for (const language of ['de', 'ja'] as const) {

      it('#groupByFormattedTimeUnit should produce same values in ' + language + ' as in English', async () => {

         // given
         vi.spyOn(Storage.prototype, 'setItem').mockReturnValue(undefined);
         const languageService = TestBed.inject(LanguageService);
         const valuesOf = (timeUnit: TimeUnit) => {
            const column: Column = { ...timeColumn, groupingTimeUnit: timeUnit };
            return service.groupByFormattedTimeUnit(baseDataFrame, column).toArray();
         };
         const timeUnits = [TimeUnit.MINUTE, TimeUnit.DAY, TimeUnit.MONTH, TimeUnit.YEAR];
         const englishValues = timeUnits.map(valuesOf);

         // when
         await languageService.use(language);
         const values = timeUnits.map(valuesOf);

         // then
         expect(values).toEqual(englishValues);
         expect(JSON.stringify(values)).toContain(datePipe.transform(now, 'MMM', undefined, 'en-US'));
         document.documentElement.lang = 'en';
      });
   }
});
