import { ChartDataService } from './chart-data.service';
import { Column, DataType, TimeUnit } from '../../model';
import { TestUtils } from '../../test';
import { ChartContext, ChartType } from '../../model/chart';

describe('ChartDataService', () => {

   const sec = 1000;
   const min = 60 * sec;

   let now: number;
   let entries: Object[];
   let chartDataService: ChartDataService;
   let context: ChartContext;

   beforeAll(() => {
      const date = new Date();
      date.setMilliseconds(0);
      date.setSeconds(0);
      now = date.getTime();
      entries = [
         { _id: 3, Time: now + min + sec, /*     */ c1: 'b', c2: 3, c3: -1 },
         { _id: 2, Time: now + 30 * sec, /*      */ c1: 'b', c2: 2, c3: 0 },
         { _id: 4, Time: now + min + 30 * sec, /**/ c1: 'b', c2: 3, c3: 4 },
         { _id: 1, Time: now, /*                 */ c1: 'a', c2: null, c3: -2 }
      ];
      chartDataService = new ChartDataService();
   });

   beforeEach(() => {
      context = new ChartContext([], ChartType.PIE.type, { top: 0, right: 0, bottom: 0, left: 0 });
      context.entries = entries.slice(0);
   });

   it('#createData should return error when max. number of DOUGHNUT chart values is exceeded', () => {

      // given
      context.chartType = ChartType.DOUGHNUT.type;
      const maxValues = ChartType.DOUGHNUT.maxValues;
      context.entries = TestUtils.generateEntries('x', maxValues + 1, 0, 1000);
      context.dataColumns = [createColumn('x', DataType.NUMBER)];

      // when
      const result = chartDataService.createData(context);

      // then
      const expectedError = ChartType.DOUGHNUT.name + ' chart: Maximum number of ' +
         maxValues.toLocaleString() + ' values exceeded.' +
         '\n\nPlease re-configure the chart or apply/refine data filtering.'
      expect(result.error).toBe(expectedError);
      expect(result.data).toBeUndefined();
      expect(context.valueRange).toBeUndefined();
   });

   it('#createData should create PIE chart data (count distinct values)', () => {

      // given
      context.chartType = ChartType.PIE.type;
      context.dataColumns = [createColumn('c1', DataType.TEXT)];

      // when
      const result = chartDataService.createData(context);

      // then
      expect(result.data.labels).toEqual(['b', 'a']);
      expect(result.data.datasets.length).toBe(1);
      expect(result.data.datasets[0].data).toEqual([3, 1]);
      expect(context.valueRange).toEqual({ min: 1, max: 3 });
      expect(result.error).toBeUndefined();
   });

   it('#createData should create PIE chart data of unique named values', () => {

      // given
      context.chartType = ChartType.PIE.type;
      context.entries = [
         { value: 0 },
         { name: null, value: 1 },
         { name: 'a', value: 1 },
         { name: 'b', value: 2 },
         { name: 'c', value: 3 },
         { name: 'x' },
         { name: 'y', value: null },
      ];
      context.dataColumns = [createColumn('value', DataType.NUMBER)];
      context.groupByColumns = [createColumn('name', DataType.TEXT)];
      context.aggregations = [];

      // when
      const result = chartDataService.createData(context);

      // then
      expect(result.data.labels).toEqual(['a', 'b', 'c']);
      expect(result.data.datasets.length).toBe(1);
      expect(result.data.datasets[0].data).toEqual([1, 2, 3]);
      expect(context.valueRange).toEqual({ min: 1, max: 3 });
      expect(result.error).toBeUndefined();
   });

   it('#createData should return error when names are not unique for PIE chart of unique named values', () => {

      // given
      context.chartType = ChartType.PIE.type;
      context.entries = [
         { name: 'a', value: 1 },
         { name: 'b', value: 2 },
         { name: 'a', value: 3 }
      ];
      context.dataColumns = [createColumn('value', DataType.NUMBER)];
      context.groupByColumns = [createColumn('name', DataType.TEXT)];
      context.aggregations = [];

      // when
      const result = chartDataService.createData(context);

      // then
      expect(result.error).toBe('Name \'a\' is not unique');
      expect(result.data).toBeUndefined();
      expect(context.valueRange).toBeUndefined();
   });

   it('#createData should return error when name is not defined for PIE chart of unique named values', () => {

      // given
      context.chartType = ChartType.PIE.type;
      context.dataColumns = [createColumn('c2', DataType.NUMBER)];
      context.aggregations = [];

      // when
      const result = chartDataService.createData(context);

      // then
      expect(result.error).toBe('Name column is not defined');
      expect(result.data).toBeUndefined();
      expect(context.valueRange).toBeUndefined();
   });

   it('#createData should create BAR chart data (count distinct values)', () => {

      // given
      context.chartType = ChartType.BAR.type;
      context.dataColumns = [createColumn('c1', DataType.TEXT)];

      // when
      const result = chartDataService.createData(context);

      // then
      expect(result.data.labels).toEqual(['b', 'a']);
      expect(result.data.datasets.length).toBe(1);
      expect(result.data.datasets[0].data).toEqual([3, 1]);
      expect(context.valueRange).toEqual({ min: 1, max: 3 });
      expect(result.error).toBeUndefined();
   });

   it('#createData should create BAR chart data of unique named values', () => {

      // given
      context.chartType = ChartType.BAR.type;
      context.entries = [
         { value: 0 },
         { name: null, value: 1 },
         { name: 'a', value: 1 },
         { name: 'b', value: 2 },
         { name: 'c', value: 3 },
         { name: 'x' },
         { name: 'y', value: null },
      ];
      context.dataColumns = [createColumn('value', DataType.NUMBER)];
      context.groupByColumns = [createColumn('name', DataType.TEXT)];
      context.aggregations = [];

      // when
      const result = chartDataService.createData(context);

      // then
      expect(result.data.labels).toEqual(['a', 'b', 'c']);
      expect(result.data.datasets.length).toBe(1);
      expect(result.data.datasets[0].data).toEqual([1, 2, 3]);
      expect(context.valueRange).toEqual({ min: 1, max: 3 });
      expect(result.error).toBeUndefined();
   });

   it('#createData should return error when names are not unique for BAR chart of unique named values', () => {

      // given
      context.chartType = ChartType.BAR.type;
      context.entries = [
         { name: 'a', value: 1 },
         { name: 'b', value: 2 },
         { name: 'a', value: 3 }
      ];
      context.dataColumns = [createColumn('value', DataType.NUMBER)];
      context.groupByColumns = [createColumn('name', DataType.TEXT)];
      context.aggregations = [];

      // when
      const result = chartDataService.createData(context);

      // then
      expect(result.error).toBe('Name \'a\' is not unique');
      expect(result.data).toBeUndefined();
      expect(context.valueRange).toBeUndefined();
   });

   it('#createData should return error when name is not defined for BAR chart of unique named values', () => {

      // given
      context.chartType = ChartType.BAR.type;
      context.dataColumns = [createColumn('c2', DataType.NUMBER)];
      context.aggregations = [];

      // when
      const result = chartDataService.createData(context);

      // then
      expect(result.error).toBe('Name column is not defined');
      expect(result.data).toBeUndefined();
      expect(context.valueRange).toBeUndefined();
   });

   it('#createData should create multi-series category LINE chart data (count distinct values)', () => {

      // given
      context.chartType = ChartType.LINE.type;
      context.dataColumns = [createColumn('c2', DataType.NUMBER)];
      context.groupByColumns = [createColumn('c1', DataType.TEXT)];

      // when
      const result = chartDataService.createData(context);

      // then
      expect(result.data.labels).toBeUndefined();
      expect(result.data.datasets.length).toBe(2);
      expect(result.data.datasets[0].data).toEqual([{ x: 'b', y: 2 } as any]);
      expect(result.data.datasets[1].data).toEqual([{ x: 'b', y: 1 } as any]);
      expect(context.valueRange).toEqual({ min: 1, max: 2 });
      expect(result.error).toBeUndefined();
   });

   it('#createData should return error when max. number of values for MULTI_BAR chart is exceeded (count distinct values)', () => {

      // given
      context.chartType = ChartType.BAR.type;
      const maxValues = ChartType.BAR.maxValues;
      context.entries = TestUtils.generateEntries('x', maxValues + 1, 0, 1000);
      TestUtils.expandEntries(context.entries, 'Time', now - min, now);
      context.dataColumns = [createColumn('x', DataType.NUMBER)];
      context.groupByColumns = [createColumn('Time', DataType.TIME, TimeUnit.MILLISECOND)];

      // when
      const result = chartDataService.createData(context);

      // then
      const expectedError = ChartType.BAR.name + ' chart: Maximum number of ' +
         maxValues.toLocaleString() + ' values exceeded.' +
         '\n\nPlease re-configure the chart or apply/refine data filtering.'
      expect(result.error).toBe(expectedError);
      expect(result.data).toBeUndefined();
      expect(context.valueRange).toBeUndefined();
   });

   it('#createData should return error when no X-Axis is defined for individual values LINE chart', () => {

      // given
      context.chartType = ChartType.LINE.type;
      context.dataColumns = [createColumn('c2', DataType.NUMBER)];
      context.aggregations = [];

      // when
      const result = chartDataService.createData(context);

      // then
      expect(result.error).toBe('X-Axis is not defined');
      expect(result.data).toBeUndefined();
      expect(context.valueRange).toBeUndefined();
   });

   it('#createData should return error when max. number of individual values for HORIZONTAL_BAR is exceeded', () => {

      // given
      context.chartType = ChartType.HORIZONTAL_BAR.type;
      const maxValues = ChartType.HORIZONTAL_BAR.maxValues;
      context.entries = TestUtils.generateEntries('x', maxValues + 1, 0, 1000);
      TestUtils.expandEntries(context.entries, 'Time', now - min, now);
      context.dataColumns = [createColumn('x', DataType.NUMBER)];
      context.groupByColumns = [createColumn('Time', DataType.TIME, TimeUnit.MILLISECOND)];
      context.aggregations = [];

      // when
      const result = chartDataService.createData(context);

      // then
      const expectedError = ChartType.HORIZONTAL_BAR.name + ' chart: Maximum number of ' +
         maxValues.toLocaleString() + ' values exceeded.' +
         '\n\nPlease re-configure the chart or apply/refine data filtering.'
      expect(result.error).toBe(expectedError);
      expect(result.data).toBeUndefined();
      expect(context.valueRange).toBeUndefined();
   });

   it('#createData should create chronologically sorted individual values data of single column', () => {

      // given
      context.chartType = ChartType.SCATTER.type;
      context.dataColumns = [createColumn('c2', DataType.NUMBER)];
      context.aggregations = [];
      context.groupByColumns = [createColumn('Time', DataType.TIME)];

      // when
      const result = chartDataService.createData(context);

      // then
      const expectedData: any = [
         { id: 2, x: entries[1]['Time'], y: 2 },
         { id: 3, x: entries[0]['Time'], y: 3 },
         { id: 4, x: entries[2]['Time'], y: 3 }
      ];
      expect(result.data.datasets.length).toBe(1);
      expect(result.data.datasets[0].label).toBe('c2');
      expect(result.data.datasets[0].data).toEqual(expectedData);
      expect(context.valueRange).toEqual({ min: 2, max: 3 });
      expect(result.error).toBeUndefined();
      expect(context.dataSampledDown).toBeFalse();
      expect(context.warning).toBeFalsy();
   });

   it('#createData should create chronologically sorted individual values data of two columns', () => {

      // given
      context.chartType = ChartType.LINE.type;
      context.dataColumns = [createColumn('c2', DataType.NUMBER), createColumn('c3', DataType.NUMBER)];
      context.aggregations = [];
      context.groupByColumns = [createColumn('Time', DataType.TIME)];

      // when
      const result = chartDataService.createData(context);

      // then
      const expectedData0: any = [
         { id: 2, x: entries[1]['Time'], y: 2 },
         { id: 3, x: entries[0]['Time'], y: 3 },
         { id: 4, x: entries[2]['Time'], y: 3 }
      ];
      const expectedData1: any = [
         { id: 1, x: entries[3]['Time'], y: -2 },
         { id: 2, x: entries[1]['Time'], y: 0 },
         { id: 3, x: entries[0]['Time'], y: -1 },
         { id: 4, x: entries[2]['Time'], y: 4 }
      ];
      expect(result.data.datasets.length).toBe(2);
      expect(result.data.datasets[0].label).toBe('c2');
      expect(result.data.datasets[0].data).toEqual(expectedData0);
      expect(result.data.datasets[1].label).toBe('c3');
      expect(result.data.datasets[1].data).toEqual(expectedData1);
      expect(context.valueRange).toEqual({ min: -2, max: 4 });
      expect(result.error).toBeUndefined();
      expect(context.dataSampledDown).toBeFalse();
      expect(context.warning).toBeFalsy();
   });

   it('#createData should create chronologically sorted individual values data when some time values are missing', () => {

      // given
      context.entries.unshift({ _id: 3, Time: undefined, c1: 'b', c2: 8 });
      context.entries.push({ _id: 3, c1: 'b', c2: 3 });
      context.entries.push({ _id: 3, Time: null, c1: 'a', c2: 9 });
      context.chartType = ChartType.LINE.type;
      context.dataColumns = [createColumn('c2', DataType.NUMBER)];
      context.groupByColumns = [createColumn('Time', DataType.TIME)];
      context.aggregations = [];

      // when
      const result = chartDataService.createData(context);

      // then
      const expectedData: any = [
         { id: 2, x: entries[1]['Time'], y: 2 },
         { id: 3, x: entries[0]['Time'], y: 3 },
         { id: 4, x: entries[2]['Time'], y: 3 }
      ];
      expect(result.data.datasets.length).toBe(1);
      expect(result.data.datasets[0].label).toBe('c2');
      expect(result.data.datasets[0].data).toEqual(expectedData);
      expect(context.valueRange).toEqual({ min: 2, max: 3 });
      expect(result.error).toBeUndefined();
      expect(context.dataSampledDown).toBeFalsy();
      expect(context.warning).toBeFalsy();
   });

   it('#createData should create chronologically sorted and splitted individual values data', () => {

      // given
      context.chartType = ChartType.LINE.type;
      context.dataColumns = [createColumn('c3', DataType.NUMBER)];
      context.splitColumns = [createColumn('c2', DataType.NUMBER)];
      context.groupByColumns = [createColumn('Time', DataType.TIME)];
      context.aggregations = [];

      // when
      const result = chartDataService.createData(context);

      // then
      const expectedData0: any = [
         { id: 3, x: entries[0]['Time'], y: -1 },
         { id: 4, x: entries[2]['Time'], y: 4 }
      ];
      const expectedData1: any = [
         { id: 2, x: entries[1]['Time'], y: 0 }
      ];
      expect(result.data.datasets.length).toBe(2);
      expect(result.data.datasets[0].label).toBe('3⯈c3');
      expect(result.data.datasets[0].data).toEqual(expectedData0);
      expect(result.data.datasets[1].label).toBe('2⯈c3');
      expect(result.data.datasets[1].data).toEqual(expectedData1);
      expect(context.valueRange).toEqual({ min: -1, max: 4 });
      expect(result.error).toBeUndefined();
      expect(context.dataSampledDown).toBeFalsy();
      expect(context.warning).toBeFalsy();
   });

   it('#createData should create down-sampled data when max number of entries is exceeded', () => {

      // given
      context.chartType = ChartType.LINE.type;
      context.entries = TestUtils.generateEntries('n1', 10_000, 0, 1000);
      TestUtils.expandEntries(context.entries, 'Time', now - min, now);
      context.dataColumns = [createColumn('n1', DataType.NUMBER)];
      context.groupByColumns = [createColumn('Time', DataType.TIME)];
      context.aggregations = [];

      // when
      const result = chartDataService.createData(context);

      // then
      expect(result.data.datasets.length).toBe(1);
      expect(result.data.datasets[0].label).toBe('n1');
      expect(result.data.datasets[0].data.length).toBeLessThan(10_000);
      expect(context.valueRange).toEqual({ min: 0, max: 1_000 });
      expect(result.error).toBeUndefined();
      expect(context.dataSampledDown).toBeTrue();
      expect(context.warning).toBeTruthy();
   });

   it('#createData should create chronologically sorted timeline data (count distinct values)', () => {

      // given
      context.chartType = ChartType.LINE.type;
      context.dataColumns = [createColumn('c1', DataType.TEXT)];
      context.splitColumns = [];
      context.groupByColumns = [createColumn('Time', DataType.TIME)];

      // when
      const result = chartDataService.createData(context);

      // then
      const expectedData0: any = [{ x: now, y: 1 }, { x: now + min, y: 2 }];
      const expectedData1: any = [{ x: now, y: 1 }];
      expect(result.data.datasets.length).toBe(2);
      expect(result.data.datasets[0].label).toBe('b');
      expect(result.data.datasets[0].data).toEqual(expectedData0);
      expect(result.data.datasets[1].label).toBe('a');
      expect(result.data.datasets[1].data).toEqual(expectedData1);
      expect(context.valueRange).toEqual({ min: 1, max: 2 });
      expect(result.error).toBeUndefined();
   });

   it('#createData should create chronologically sorted and splitted timeline data (count distinct values)', () => {

      // given
      context.entries.push({ _id: 5, c1: 'a', c2: -2 });
      context.chartType = ChartType.LINE.type;
      context.dataColumns = [createColumn('c1', DataType.TEXT)];
      context.splitColumns = [createColumn('c2', DataType.NUMBER)];
      context.groupByColumns = [createColumn('Time', DataType.TIME)];

      // when
      const result = chartDataService.createData(context);

      // then
      const expectedData0: any = [{ x: now + min, y: 2 }];
      const expectedData1: any = [{ x: now, y: 1 }];
      expect(result.data.datasets.length).toBe(2);
      expect(result.data.datasets[0].label).toBe('3⯈b');
      expect(result.data.datasets[0].data).toEqual(expectedData0);
      expect(result.data.datasets[1].label).toBe('2⯈b');
      expect(result.data.datasets[1].data).toEqual(expectedData1);
      expect(context.valueRange).toEqual({ min: 1, max: 2 });
      expect(result.error).toBeUndefined();
   });

   function createColumn(name: string, dataType: DataType, groupingTimeUnit?: TimeUnit): Column {
      const column: Column = {
         name: name,
         dataType: dataType,
         width: 10
      };
      column.groupingTimeUnit = groupingTimeUnit;
      if (dataType === DataType.TIME && !groupingTimeUnit) {
         column.groupingTimeUnit = TimeUnit.MINUTE;
      }
      return column;
   }
});