import { Column, DataType, TimeUnit } from 'app/shared/model';
import { ChartContext, ChartType, DataPoint } from 'app/shared/model/chart';
import { shuffle } from 'd3';
import { DateTime } from 'luxon';
import { TestBed } from '@angular/core/testing';
import { LanguageService } from 'app/shared/services/language';
import { ChartDataHelper } from './chart-data-helper';

describe('ChartDataHelper', () => {

   const dataPoints: DataPoint[] = [
      { x: 1, y: 5 },
      { x: 2, y: 1 },
      { x: 3, y: 3 },
      { x: 4, y: 8 },
      { x: 5, y: 2 },
      { x: 6, y: 0 }
   ];
   let now: number;

   beforeAll(() => {
      const date = new Date();
      date.setMilliseconds(0);
      date.setSeconds(0);
      now = date.getTime();
   });

   afterEach(() => document.documentElement.lang = 'en');

   it('#countDistinctValues should return data points', () => {

      // given
      const context = new ChartContext([], ChartType.PIE.type, { top: 0, right: 0, bottom: 0, left: 0 });
      context.dataColumns = [createColumn('y', DataType.NUMBER)];
      context.entries = [
         { _id: 1, x: 'a', y: 1 },
         { _id: 2, x: 'a', y: 2 },
         { _id: 3, x: 'b', y: 2 },
         { _id: 4, x: 'b' },
         { _id: 5, x: 'b', y: 3 },
         { _id: 6, x: 'b', y: 3 },
         { _id: 7, x: 'b', y: null }
      ];

      // when
      const distinceValues = ChartDataHelper.countDistinctValues(context);

      // then
      const expectedValues: DataPoint[] = [
         { x: 1, y: 1 },
         { x: 2, y: 2 },
         { x: 3, y: 2 }
      ];
      expect(distinceValues).toEqual(expectedValues);
   });

   it('#extractGroupingValue should return unchanged value when data type is NUMBER', () => {

      // given
      const entry = { _id: 1, x: 1, y: 2 };
      const groupByColumn = createColumn('x', DataType.NUMBER);

      // when
      const value = ChartDataHelper.extractGroupingValue(entry, groupByColumn);

      // then
      expect(value).toBe(1);
   });

   it('#extractGroupingValue should return grouping time unit base date when type is TIME', () => {

      // given
      const date = new Date();
      const entry = { _id: 1, x: 1, y: date.getTime() };
      const groupByColumn = createColumn('y', DataType.TIME, TimeUnit.HOUR);

      // when
      const value = ChartDataHelper.extractGroupingValue(entry, groupByColumn);

      // then
      date.setMilliseconds(0);
      date.setSeconds(0);
      date.setMinutes(0);
      expect(value).toBe(date.getTime());
   });

   it('#extractGroupingValue should return undefined when time is undefined', () => {

      // given
      const entry = { _id: 1, x: 1 };
      const groupByColumn = createColumn('y', DataType.TIME, TimeUnit.HOUR);

      // when
      const value = ChartDataHelper.extractGroupingValue(entry, groupByColumn);

      // then
      expect(value).toBeUndefined();
   });

   it('#findDataPoint should return undefined when no maching data point is found', () => {

      // when
      const dataPoint = ChartDataHelper.findDataPoint(dataPoints, 99);

      // then
      expect(dataPoint).toBeUndefined();
   });

   it('#findDataPoint should return data point with maching x attribute', () => {

      // when
      const dataPoint = ChartDataHelper.findDataPoint(dataPoints, 4);

      // then
      expect(dataPoint).toEqual({ x: 4, y: 8 });
   });

   it('#categoryData should return labels and values of named entries', () => {

      // given
      const context = new ChartContext([], ChartType.BAR.type, { top: 0, right: 0, bottom: 0, left: 0 });
      context.dataColumns = [createColumn('y', DataType.NUMBER), createColumn('z', DataType.NUMBER)];
      context.groupByColumns = [createColumn('x', DataType.TEXT)];
      context.entries = [
         { x: 'a', y: 1, z: 10 },
         { y: 5, z: 50 },
         { x: 'b', z: 20 },
         { x: 'c' },
         { x: 'c', y: 3 }
      ];

      // when
      const categoryData = ChartDataHelper.categoryData(context);

      // then
      expect(categoryData).toEqual({
         labels: ['a', 'b', 'c'],
         dataSets: [
            { label: 'y', values: [1, undefined, 3] },
            { label: 'z', values: [10, 20, undefined] }
         ]
      });
   });

   it('#categoryData should throw error when names are not unique', () => {

      // given
      const context = new ChartContext([], ChartType.BAR.type, { top: 0, right: 0, bottom: 0, left: 0 });
      context.dataColumns = [createColumn('y', DataType.NUMBER)];
      context.groupByColumns = [createColumn('x', DataType.TEXT)];
      context.entries = [
         { x: 'a', y: 1 },
         { x: 'b', y: 2 },
         { x: 'a', y: 3 }
      ];

      // when
      const extraction = () => ChartDataHelper.categoryData(context);

      // then
      expect(extraction).toThrow(expect.objectContaining({ message: 'Value \'a\' is not unique' }));
   });

   it('#categoryData should throw error with formatted time when time names are not unique', () => {

      // given
      const context = new ChartContext([], ChartType.BAR.type, { top: 0, right: 0, bottom: 0, left: 0 });
      context.dataColumns = [createColumn('y', DataType.NUMBER)];
      context.groupByColumns = [createColumn('x', DataType.TIME, TimeUnit.SECOND)];
      context.entries = [
         { x: now, y: 1 },
         { x: now, y: 2 }
      ];

      // when
      const extraction = () => ChartDataHelper.categoryData(context);

      // then
      expect(extraction).toThrow(expect.objectContaining({ message: 'Value \'' + formatTime(now) + '\' is not unique' }));
   });

   it('#categoryData should throw non-unique value error in current language', async () => {

      // given
      vi.spyOn(Storage.prototype, 'setItem').mockReturnValue(undefined);
      await TestBed.inject(LanguageService).use('de');
      const context = new ChartContext([], ChartType.BAR.type, { top: 0, right: 0, bottom: 0, left: 0 });
      context.dataColumns = [createColumn('y', DataType.NUMBER)];
      context.groupByColumns = [createColumn('x', DataType.TEXT)];
      context.entries = [
         { x: 'a', y: 1 },
         { x: 'a', y: 2 }
      ];

      // when
      const extraction = () => ChartDataHelper.categoryData(context);

      // then
      expect(extraction).toThrow(expect.objectContaining({ message: 'Wert \'a\' ist nicht eindeutig' }));
   });

   it('#categoryData should keep name zero', () => {

      // given
      const context = new ChartContext([], ChartType.BAR.type, { top: 0, right: 0, bottom: 0, left: 0 });
      context.dataColumns = [createColumn('y', DataType.NUMBER)];
      context.groupByColumns = [createColumn('x', DataType.NUMBER)];
      context.entries = [
         { x: 0, y: 1 },
         { x: 1, y: 2 }
      ];

      // when
      const categoryData = ChartDataHelper.categoryData(context);

      // then
      expect(categoryData).toEqual({
         labels: [0, 1],
         dataSets: [{ label: 'y', values: [1, 2] }]
      });
   });

   it('#uniqueNameCount should return number of names when all names are distinct', () => {

      // given
      const entries = [{ x: 'a', y: 1 }, { x: 'b', y: 2 }, { x: 'c', y: 3 }];

      // when
      const count = ChartDataHelper.uniqueNameCount(entries, createColumn('x', DataType.TEXT), [createColumn('y', DataType.NUMBER)]);

      // then
      expect(count).toBe(3);
   });

   it('#uniqueNameCount should return undefined when names are not distinct', () => {

      // given
      const entries = [{ x: 'a', y: 1 }, { x: 'b', y: 2 }, { x: 'a', y: 3 }];

      // when
      const count = ChartDataHelper.uniqueNameCount(entries, createColumn('x', DataType.TEXT), [createColumn('y', DataType.NUMBER)]);

      // then
      expect(count).toBeUndefined();
   });

   it('#uniqueNameCount should ignore entries without name', () => {

      // given
      const entries = [{ x: 'a', y: 1 }, { y: 2 }, { x: '', y: 3 }, { x: null, y: 4 }];

      // when
      const count = ChartDataHelper.uniqueNameCount(entries, createColumn('x', DataType.TEXT), [createColumn('y', DataType.NUMBER)]);

      // then
      expect(count).toBe(1);
   });

   it('#uniqueNameCount should ignore name of preceding entry without data value', () => {

      // given
      const entries = [{ x: 'a' }, { x: 'a', y: null }, { x: 'a', y: 1 }];

      // when
      const count = ChartDataHelper.uniqueNameCount(entries, createColumn('x', DataType.TEXT), [createColumn('y', DataType.NUMBER)]);

      // then
      expect(count).toBe(1);
   });

   it('#uniqueNameCount should return undefined when entry without data value repeats name of entry with data value', () => {

      // given
      const entries = [{ x: 'a', y: 1 }, { x: 'a' }];

      // when
      const count = ChartDataHelper.uniqueNameCount(entries, createColumn('x', DataType.TEXT), [createColumn('y', DataType.NUMBER)]);

      // then
      expect(count).toBeUndefined();
   });

   it('#uniqueNameCount should return zero when entries are undefined', () => {

      // when
      const count = ChartDataHelper.uniqueNameCount(undefined, createColumn('x', DataType.TEXT), [createColumn('y', DataType.NUMBER)]);

      // then
      expect(count).toBe(0);
   });

   it('#uniqueNameCount should count name zero', () => {

      // given
      const entries = [{ x: 0, y: 1 }, { x: 1, y: 2 }];

      // when
      const count = ChartDataHelper.uniqueNameCount(entries, createColumn('x', DataType.NUMBER), [createColumn('y', DataType.NUMBER)]);

      // then
      expect(count).toBe(2);
   });

   it('#uniqueNameCount should return undefined when name zero is not distinct', () => {

      // given
      const entries = [{ x: 0, y: 1 }, { x: 0, y: 2 }];

      // when
      const count = ChartDataHelper.uniqueNameCount(entries, createColumn('x', DataType.NUMBER), [createColumn('y', DataType.NUMBER)]);

      // then
      expect(count).toBeUndefined();
   });

   it('#sortAscending should return data points ascending sorted by attribute x', () => {

      // given
      const actualDataPoints = shuffle(dataPoints.slice(0));

      // when
      ChartDataHelper.sortAscending(actualDataPoints);

      // then
      expect(actualDataPoints).toEqual(dataPoints);
   });

   function formatTime(time: number): string {
      return DateTime.fromMillis(time).toFormat('d MMM yyyy HH:mm:ss');
   }

   function createColumn(name: string, dataType: DataType, groupingTimeUnit?: TimeUnit): Column {
      return {
         name: name,
         dataType: dataType,
         width: 10,
         groupingTimeUnit: groupingTimeUnit
      };
   }
});
