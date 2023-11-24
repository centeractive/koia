import { Column, DataType, TimeUnit } from 'app/shared/model';
import { ChartContext, ChartType, DataPoint } from 'app/shared/model/chart';
import { shuffle } from 'd3';
import { DateTime } from 'luxon';
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

   it('#convertTime should return entries with formatted time', () => {

      // given
      const entries = [
         { _id: 1, x: now + 1_000, y: 10 },
         { _id: 2, x: now + 2_000, y: 20 },
         { _id: 3, x: undefined, y: 30 },
         { _id: 4, x: now + 3_000, y: 40 }
      ];

      // when
      const convertedEntries = ChartDataHelper.convertTime(entries, createColumn('x', DataType.TIME, TimeUnit.SECOND));

      // then
      const expectedEntries = [
         { _id: 1, x: formatTime(now + 1_000), y: 10 },
         { _id: 2, x: formatTime(now + 2_000), y: 20 },
         { _id: 4, x: formatTime(now + 3_000), y: 40 }
      ];
      expect(convertedEntries).toEqual(expectedEntries);
   });

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

   it('#valuesOfDistinctNames should return data points when all names are distinct', () => {

      // given
      const context = new ChartContext([], ChartType.PIE.type, { top: 0, right: 0, bottom: 0, left: 0 });
      context.groupByColumns = [createColumn('_id', DataType.NUMBER)];
      context.dataColumns = [createColumn('y', DataType.NUMBER)];
      context.entries = [
         { _id: 1, x: 'a', y: 1 },
         { x: 's', y: 5 },
         { _id: 2, x: 'b', y: 2 },
         { _id: 3, x: 'c', y: 2 },
         { _id: null, x: 'd', y: 7 },
         { _id: 4, x: 'd', y: 3 },
         { _id: 5, x: 'e', y: 3 },
         { _id: 6, x: 'e' },
         { _id: 7, x: 'e', y: null },
      ];

      // when
      const values = ChartDataHelper.valuesOfDistinctNames(context);

      // then
      const expectedValues: DataPoint[] = [
         { x: 1, y: 1 },
         { x: 2, y: 2 },
         { x: 3, y: 2 },
         { x: 4, y: 3 },
         { x: 5, y: 3 }
      ];
      expect(values).toEqual(expectedValues);
   });

   it('#valuesOfDistinctNames should throw error when not all names are distinct', () => {

      // given
      const context = new ChartContext([], ChartType.PIE.type, { top: 0, right: 0, bottom: 0, left: 0 });
      context.groupByColumns = [createColumn('x', DataType.TEXT)];
      context.dataColumns = [createColumn('y', DataType.NUMBER)];
      context.entries = [
         { _id: 1, x: 'a', y: 1 },
         { _id: 2, x: 'b', y: 2 },
         { _id: 3, x: 'a', y: 1 },
      ];
      spyOn(ChartDataHelper, 'valuesOfDistinctNames').and.callThrough();

      // when -> then
      expect(() => ChartDataHelper.valuesOfDistinctNames(context)).toThrowError('Value \'a\' is not unique');
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
