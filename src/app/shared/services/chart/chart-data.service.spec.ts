import { ChartDataService } from './chart-data.service';
import { Column, DataType, TimeUnit } from '../../model';
import { TestUtils } from '../../test';
import { ChartContext, ChartType } from 'app/shared/model/chart';

declare var d3: any;

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

   it('#createData should return error when max. number of DONUT chart values is exceeded', () => {

      // given
      context.chartType = ChartType.DONUT.type;
      const maxValues = ChartType.DONUT.maxValues;
      context.entries = TestUtils.generateEntries('x', maxValues + 1, 0, 1000);
      context.dataColumns = [createColumn('x', DataType.NUMBER)];

      // when
      const result = chartDataService.createData(context);

      // then
      const expectedError = ChartType.DONUT.name + ' chart: Maximum number of ' + maxValues + ' values exceeded.' +
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
      const expectedData = [
         { x: 'b', y: 3 },
         { x: 'a', y: 1 }
      ];
      expect(result.data).toEqual(expectedData);
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
      const expectedData = [
         { x: 'a', y: 1 },
         { x: 'b', y: 2 },
         { x: 'c', y: 3 },
      ];
      expect(result.data).toEqual(expectedData);
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
      expect(result.error).toBe('Names are not unique');
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
      const expectedData = [
         {
            values: [
               { x: 'b', y: 3 },
               { x: 'a', y: 1 }
            ]
         }
      ];
      expect(result.data).toEqual(expectedData);
      expect(context.valueRange).toEqual({ min: 1, max: 3 });
      expect(result.error).toBeUndefined();
   });

   it('#createData should create BAR chart data of of unique named values', () => {

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
      const expectedData = [
         {
            values: [
               { x: 'a', y: 1 },
               { x: 'b', y: 2 },
               { x: 'c', y: 3 },
            ]
         }
      ];
      expect(result.data).toEqual(expectedData);
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
      expect(result.error).toBe('Names are not unique');
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

   it('#createData should create SUNBURST chart data when no hierarchy is specified', () => {

      // given
      context.chartType = ChartType.SUNBURST.type;
      context.dataColumns = [createColumn('c1', DataType.TEXT)];

      // when
      const result = chartDataService.createData(context);

      // then
      const expectedData = [
         {
            name: 'Data', children: [
               { name: 'b', value: 3 },
               { name: 'a', value: 1 }
            ]
         }
      ];
      expect(result.data).toEqual(expectedData);
      expect(context.valueRange).toBeUndefined();
      expect(result.error).toBeUndefined();
   });

   it('#createData should create SUNBURST chart data when single columns hierarchy is specified', () => {

      // given
      context.chartType = ChartType.SUNBURST.type;
      context.dataColumns = [createColumn('c2', DataType.NUMBER)];
      context.groupByColumns = [createColumn('c1', DataType.TEXT)];

      // when
      const result = chartDataService.createData(context);

      // then
      const expected = [
         {
            name: 'Data', children: [
               {
                  name: 'b', children: [
                     { name: '2', value: 1 },
                     { name: '3', value: 2 }
                  ]
               },
               {
                  name: 'a', children: [
                     { name: '<empty>', value: 1 }
                  ]
               }
            ]
         }
      ];
      expect(result.data).toEqual(expected);
      expect(context.valueRange).toBeUndefined();
      expect(result.error).toBeUndefined();
   });

   it('#createData should create SUNBURST chart data when multi-column hierarchy is specified', () => {

      // given
      context.chartType = ChartType.SUNBURST.type;
      context.dataColumns = [createColumn('c2', DataType.NUMBER)];
      context.groupByColumns = [createColumn('Time', DataType.TIME), createColumn('c1', DataType.TEXT)];

      // when
      const result = chartDataService.createData(context);

      // then
      const timeFormat = d3.time.format('%-d %b %Y %H:%M');
      const nowFormatted = timeFormat(new Date(now));
      const nowPlusMinFormatted = timeFormat(new Date(now + min));
      const expectedData = [{
         name: 'Data', children: [
            {
               name: nowPlusMinFormatted, children: [
                  {
                     name: 'b', children: [{ name: '3', value: 2 }]
                  }
               ]
            },
            {
               name: nowFormatted, children: [
                  {
                     name: 'b', children: [{ name: '2', value: 1 }]
                  },
                  {
                     name: 'a', children: [{ name: '<empty>', value: 1 }]
                  }
               ]
            }]
      }];
      expect(result.data).toEqual(expectedData);
      expect(context.valueRange).toBeUndefined();
      expect(result.error).toBeUndefined();
   });

   it('#createData should return error when no X-Axis is defined for LINE_WITH_FOCUS chart (count distinct values)', () => {

      // given
      context.chartType = ChartType.LINE_WITH_FOCUS.type;
      context.dataColumns = [createColumn('c2', DataType.NUMBER)];

      // when
      const result = chartDataService.createData(context);

      // then
      expect(result.error).toBe('X-Axis is not defined');
      expect(result.data).toBeUndefined();
      expect(context.valueRange).toBeUndefined();
   });

   it('#createData should create multi-series LINE chart data (count distinct values)', () => {

      // given
      context.chartType = ChartType.LINE.type;
      context.dataColumns = [createColumn('c2', DataType.NUMBER)];
      context.groupByColumns = [createColumn('c1', DataType.TEXT)];

      // when
      const result = chartDataService.createData(context);

      // then
      const expectedData = [
         { key: 3, values: [{ x: 'b', y: 2 }] },
         { key: 2, values: [{ x: 'b', y: 1 }] }
      ]
      expect(result.data).toEqual(expectedData);
      expect(context.valueRange).toEqual({ min: 1, max: 2 });
      expect(result.error).toBeUndefined();
   });

   it('#createData should return error when max. number of values for MULTI_BAR chart is exceeded (count distinct values)', () => {

      // given
      context.chartType = ChartType.MULTI_BAR.type;
      const maxValues = ChartType.MULTI_BAR.maxValues;
      context.entries = TestUtils.generateEntries('x', maxValues + 1, 0, 1000);
      TestUtils.expandEntries(context.entries, 'Time', now - min, now);
      context.dataColumns = [createColumn('x', DataType.NUMBER)];
      context.groupByColumns = [createColumn('Time', DataType.TIME, TimeUnit.MILLISECOND)];

      // when
      const result = chartDataService.createData(context);

      // then
      const expectedError = ChartType.MULTI_BAR.name + ' chart: Maximum number of ' + maxValues + ' values exceeded.' +
         '\n\nPlease re-configure the chart or apply/refine data filtering.'
      expect(result.error).toBe(expectedError);
      expect(result.data).toBeUndefined();
      expect(context.valueRange).toBeUndefined();
   });

   it('#createData should return error when no X-Axis is defined for individual values LINE chart', () => {

      // given
      context.chartType = ChartType.LINE.type;
      context.dataColumns = [createColumn('c2', DataType.NUMBER)];
      context.aggregations = []

      // when
      const result = chartDataService.createData(context);

      // then
      expect(result.error).toBe('X-Axis is not defined');
      expect(result.data).toBeUndefined();
      expect(context.valueRange).toBeUndefined();
   });

   it('#createData should return error when max. number of individual values for MULTI_HORIZONTAL_BAR is exceeded', () => {

      // given
      context.chartType = ChartType.MULTI_HORIZONTAL_BAR.type;
      const maxValues = ChartType.MULTI_HORIZONTAL_BAR.maxValues;
      context.entries = TestUtils.generateEntries('x', maxValues + 1, 0, 1000);
      TestUtils.expandEntries(context.entries, 'Time', now - min, now);
      context.dataColumns = [createColumn('x', DataType.NUMBER)];
      context.groupByColumns = [createColumn('Time', DataType.TIME, TimeUnit.MILLISECOND)];
      context.aggregations = [];

      // when
      const result = chartDataService.createData(context);

      // then
      const expectedError = ChartType.MULTI_HORIZONTAL_BAR.name + ' chart: Maximum number of ' + maxValues + ' values exceeded.' +
         '\n\nPlease re-configure the chart or apply/refine data filtering.'
      expect(result.error).toBe(expectedError);
      expect(result.data).toBeUndefined();
      expect(context.valueRange).toBeUndefined();
   });


   it('#createData should create chronologically sorted individual values data of single column', () => {

      // given
      context.chartType = ChartType.MULTI_BAR.type;
      context.dataColumns = [createColumn('c2', DataType.NUMBER)];
      context.aggregations = [];
      context.groupByColumns = [createColumn('Time', DataType.TIME)];

      // when
      const result = chartDataService.createData(context);

      // then
      const expectedData = [{
         key: 'c2',
         values: [
            { id: 2, x: entries[1]['Time'], y: 2 },
            { id: 3, x: entries[0]['Time'], y: 3 },
            { id: 4, x: entries[2]['Time'], y: 3 }
         ]
      }];
      expect(result.data).toEqual(expectedData);
      expect(context.valueRange).toEqual({ min: 2, max: 3 });
      expect(result.error).toBeUndefined();
      expect(context.dataSampledDown).toBeFalsy();
      expect(context.warning).toBeFalsy();
   });

   it('#createData should create chronologically sorted individual values data of two column', () => {

      // given
      context.chartType = ChartType.MULTI_BAR.type;
      context.dataColumns = [createColumn('c2', DataType.NUMBER), createColumn('c3', DataType.NUMBER)];
      context.aggregations = [];
      context.groupByColumns = [createColumn('Time', DataType.TIME)];

      // when
      const result = chartDataService.createData(context);

      // then
      const expectedData = [
         {
            key: 'c2',
            values: [
               { id: 2, x: entries[1]['Time'], y: 2 },
               { id: 3, x: entries[0]['Time'], y: 3 },
               { id: 4, x: entries[2]['Time'], y: 3 }
            ]
         },
         {
            key: 'c3',
            values: [
               { id: 1, x: entries[3]['Time'], y: -2 },
               { id: 2, x: entries[1]['Time'], y: 0 },
               { id: 3, x: entries[0]['Time'], y: -1 },
               { id: 4, x: entries[2]['Time'], y: 4 }
            ]
         }
      ];
      expect(result.data).toEqual(expectedData);
      expect(context.valueRange).toEqual({ min: -2, max: 4 });
      expect(result.error).toBeUndefined();
      expect(context.dataSampledDown).toBeFalsy();
      expect(context.warning).toBeFalsy();
   });

   it('#createData should create chronologically sorted individual values data when some time values are missing', () => {

      // given
      context.entries.unshift({ _id: 3, Time: undefined, c1: 'b', c2: 8 });
      context.entries.push({ _id: 3, c1: 'b', c2: 3 });
      context.entries.push({ _id: 3, Time: null, c1: 'a', c2: 9 });
      context.chartType = ChartType.LINE_WITH_FOCUS.type;
      context.dataColumns = [createColumn('c2', DataType.NUMBER)];
      context.groupByColumns = [createColumn('Time', DataType.TIME)];
      context.aggregations = [];

      // when
      const result = chartDataService.createData(context);

      // then
      const expected = [{
         key: 'c2',
         values: [
            { id: 2, x: entries[1]['Time'], y: 2 },
            { id: 3, x: entries[0]['Time'], y: 3 },
            { id: 4, x: entries[2]['Time'], y: 3 }
         ]
      }];
      expect(result.data).toEqual(expected);
      expect(context.valueRange).toEqual({ min: 2, max: 3 });
      expect(result.error).toBeUndefined();
      expect(context.dataSampledDown).toBeFalsy();
      expect(context.warning).toBeFalsy();
   });

   it('#createData should create chronologically sorted and splitted individual values data', () => {

      // given
      context.chartType = ChartType.LINE_WITH_FOCUS.type;
      context.dataColumns = [createColumn('c3', DataType.NUMBER)];
      context.splitColumns = [createColumn('c2', DataType.NUMBER)];
      context.groupByColumns = [createColumn('Time', DataType.TIME)];
      context.aggregations = [];

      // when
      const result = chartDataService.createData(context);

      // then
      const expected = [
         {
            key: '3⯈c3',
            values: [
               { id: 3, x: entries[0]['Time'], y: -1 },
               { id: 4, x: entries[2]['Time'], y: 4 }
            ]
         },
         {
            key: '2⯈c3',
            values: [
               { id: 2, x: entries[1]['Time'], y: 0 }
            ]
         }
      ];
      expect(result.data).toEqual(expected);
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
      expect(result.data).toBeDefined();
      expect(result.data.length).toBe(1);
      expect(result.data[0]['key']).toBe('n1');
      expect(result.data[0]['values'].length).toBeLessThan(10_000);
      expect(context.valueRange).toEqual({ min: 0, max: 1_000 });
      expect(result.error).toBeUndefined();
      expect(context.dataSampledDown).toBeTruthy();
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
      const expectedData = [
         {
            key: 'b',
            values: [{ x: now, y: 1 }, { x: now + min, y: 2 }]
         },
         {
            key: 'a',
            values: [{ x: now, y: 1 }]
         }
      ];
      expect(result.data).toEqual(expectedData);
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
      const expectedData = [
         {
            key: '3⯈b',
            values: [{ x: now + min, y: 2 }]
         },
         {
            key: '2⯈b',
            values: [{ x: now, y: 1 }]
         }
      ];
      expect(result.data).toEqual(expectedData);
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
