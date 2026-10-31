import { AggregationService } from './aggregation.service';
import { SummaryContext, Aggregation, DataType, Column, TimeUnit, VALUE_AGGREGATIONS } from 'app/shared/model';
import { IDataFrame, DataFrame, Series } from 'data-forge';
import { Settings } from 'luxon';

describe('AggregationService', () => {

  const sec = 1000;
  const min = 60 * sec;

  let now: number;
  let columns: Column[];
  let baseData: IDataFrame;
  let aggregationService: AggregationService;
  let context: SummaryContext;

  beforeAll(() => {
    const date = new Date();
    date.setMilliseconds(0);
    date.setSeconds(0);
    now = date.getTime();
    columns = [
      { name: 'Time', dataType: DataType.TIME, width: 100 },
      { name: 'c1', dataType: DataType.TEXT, width: 100 },
      { name: 'c2', dataType: DataType.NUMBER, width: 100 },
      { name: 'c3', dataType: DataType.TEXT, width: 100 },
      { name: 'Count', dataType: DataType.NUMBER, width: 100 },
      { name: 'Sum', dataType: DataType.TEXT, width: 100 },
      { name: 'Time (per minute)', dataType: DataType.TEXT, width: 100 }
    ];
    baseData = new DataFrame([
      { Time: now, /*                */ c1: 'a', c2: 1, c3: 'y' },
      { Time: now + 20 * sec, /*     */ c1: 'a', c2: 1, c3: 'y' },
      { Time: now + 40 * sec, /*     */ c1: 'a', c2: 2, c3: 'y' },
      { Time: now + min + sec, /*    */ c1: 'b', c2: 2, c3: 'x' },
      { Time: now + 2 * min + sec, /**/ c1: 'b', c2: 3, c3: 'x' },
      { Time: now + 2 * min + 30 * sec, c1: 'b', c2: 3, c3: 'x' }
    ]);
    aggregationService = new AggregationService();
  });

  beforeEach(() => {
    context = new SummaryContext(columns);
  });

  it('#compute should return COUNT summary for text column', () => {

    // given
    context.dataColumns = [findColumn('c1')];
    context.aggregations = [Aggregation.COUNT];

    // when
    const data: IDataFrame<number, object> = aggregationService.compute(baseData, context);

    // then
    const expected = [
      { c1: 'a', Count: 3 },
      { c1: 'b', Count: 3 }
    ];
    expect(data.toArray()).toEqual(expected);
  });

  it('#compute should return COUNT summary for number column', () => {

    // given
    context.dataColumns = [findColumn('c2')];
    context.aggregations = [Aggregation.COUNT];

    // when
    const data: IDataFrame<number, object> = aggregationService.compute(baseData, context);

    // then
    const expected = [
      { c2: 1, Count: 2 },
      { c2: 2, Count: 2 },
      { c2: 3, Count: 2 }
    ];
    expect(data.toArray()).toEqual(expected);
  });

  it('#compute should return column-grouped COUNT summary', () => {

    // given
    context.dataColumns = [findColumn('c2')];
    context.groupByColumns = [findColumn('c1')];
    context.aggregations = [Aggregation.COUNT];

    // when
    const data: IDataFrame<number, object> = aggregationService.compute(baseData, context);

    // then
    const expected = [
      { c1: 'a', c2: 1, Count: 2 },
      { c1: 'a', c2: 2, Count: 1 },
      { c1: 'b', c2: 2, Count: 1 },
      { c1: 'b', c2: 3, Count: 2 }
    ];
    expect(data.toArray()).toEqual(expected);
  });

  it('#compute should return timeunit-grouped COUNT summary', () => {

    // given
    context.dataColumns = [findColumn('c1')];
    context.groupByColumns = [findColumn('Time', TimeUnit.MINUTE)];
    context.aggregations = [Aggregation.COUNT];

    // when
    const data: IDataFrame<number, object> = aggregationService.compute(baseData, context);

    // then
    const expected = [
      { 'Time (per minute)': now, c1: 'a', Count: 3 },
      { 'Time (per minute)': now + min, c1: 'b', Count: 1 },
      { 'Time (per minute)': now + 2 * min, c1: 'b', Count: 2 }
    ];
    expect(data.toArray()).toEqual(expected);
  });

  it('#compute should return timeunit- & column-grouped COUNT summary', () => {

    // given
    context.dataColumns = [findColumn('c2')];
    context.groupByColumns = [findColumn('Time', TimeUnit.MINUTE), findColumn('c1')];
    context.aggregations = [Aggregation.COUNT];

    // when
    const data: IDataFrame<number, object> = aggregationService.compute(baseData, context);

    // then
    const expected = [
      { 'Time (per minute)': now, c1: 'a', c2: 1, Count: 2 },
      { 'Time (per minute)': now, c1: 'a', c2: 2, Count: 1 },
      { 'Time (per minute)': now + min, c1: 'b', c2: 2, Count: 1 },
      { 'Time (per minute)': now + 2 * min, c1: 'b', c2: 3, Count: 2 }
    ];
    expect(data.toArray()).toEqual(expected);
  });

  it('#compute should return AVG summary', () => {

    // given
    context.dataColumns = [findColumn('c2')];
    context.aggregations = [Aggregation.AVG];

    // when
    const data: IDataFrame<number, object> = aggregationService.compute(baseData, context);

    // then
    const expected = [
      { Average: 2 }
    ];
    expect(data.toArray()).toEqual(expected);
  });

  it('#compute should return MAX summary', () => {

    // given
    context.dataColumns = [findColumn('c2')];
    context.aggregations = [Aggregation.MAX];

    // when
    const data: IDataFrame<number, object> = aggregationService.compute(baseData, context);

    // then
    const expected = [
      { Max: 3 }
    ];
    expect(data.toArray()).toEqual(expected);
  });

  it('#compute should return MIN summary', () => {

    // given
    context.dataColumns = [findColumn('c2')];
    context.aggregations = [Aggregation.MIN];

    // when
    const data: IDataFrame<number, object> = aggregationService.compute(baseData, context);

    // then
    const expected = [
      { Min: 1 }
    ];
    expect(data.toArray()).toEqual(expected);
  });

  it('#compute should return MEDIAN summary', () => {

    // given
    context.dataColumns = [findColumn('c2')];
    context.aggregations = [Aggregation.MEDIAN];

    // when
    const data: IDataFrame<number, object> = aggregationService.compute(baseData, context);

    // then
    const expected = [
      { Median: 2 }
    ];
    expect(data.toArray()).toEqual(expected);
  });

  it('#compute should return SUM summary', () => {

    // given
    context.dataColumns = [findColumn('c2')];
    context.aggregations = [Aggregation.SUM];

    // when
    const data: IDataFrame<number, object> = aggregationService.compute(baseData, context);

    // then
    const expected = [
      { Sum: 12 }
    ];
    expect(data.toArray()).toEqual(expected);
  });

  it('#compute should return multi-aggregated summary', () => {

    // given
    context.dataColumns = [findColumn('c2')];
    context.aggregations = [Aggregation.MAX, Aggregation.MIN, Aggregation.SUM];

    // when
    const data: IDataFrame<number, object> = aggregationService.compute(baseData, context);

    // then
    const expected = [
      { Max: 3, Min: 1, Sum: 12 }
    ];
    expect(data.toArray()).toEqual(expected);
  });

  it('#compute should return MIN summary grouped by single column', () => {

    // given
    context.dataColumns = [findColumn('c2')];
    context.groupByColumns = [findColumn('c1')];
    context.aggregations = [Aggregation.MIN];

    // when
    const data: IDataFrame<number, object> = aggregationService.compute(baseData, context);

    // then
    const expected = [
      { c1: 'a', Min: 1 },
      { c1: 'b', Min: 2 }
    ];
    expect(data.toArray()).toEqual(expected);
  });

  it('#compute should return MAX summary grouped by two columns', () => {

    // given
    context.dataColumns = [findColumn('c2')];
    context.groupByColumns = [findColumn('c1'), findColumn('c3')];
    context.aggregations = [Aggregation.MAX];

    // when
    const data: IDataFrame<number, object> = aggregationService.compute(baseData, context);

    // then
    const expected = [
      { c1: 'a', c3: 'y', Max: 2 },
      { c1: 'b', c3: 'x', Max: 3 }
    ];
    expect(data.toArray()).toEqual(expected);
  });

  it('#compute should return SUM summary grouped by timeunit & another column', () => {

    // given
    context.dataColumns = [findColumn('c2')];
    context.groupByColumns = [findColumn('Time', TimeUnit.MINUTE), findColumn('c1')];
    context.aggregations = [Aggregation.SUM];

    // when
    const data: IDataFrame<number, object> = aggregationService.compute(baseData, context);

    // then
    const expected = [
      { 'Time (per minute)': now, c1: 'a', Sum: 4 },
      { 'Time (per minute)': now + min, c1: 'b', Sum: 2 },
      { 'Time (per minute)': now + 2 * min, c1: 'b', Sum: 6 }
    ];
    expect(data.toArray()).toEqual(expected);
  });

  it('#compute should return MEDIAN summary grouped by timeunit followed by two other columns', () => {

    // given
    context.dataColumns = [findColumn('c2')];
    context.groupByColumns = [findColumn('Time', TimeUnit.MINUTE), findColumn('c1'), findColumn('c3')];
    context.aggregations = [Aggregation.MEDIAN];

    // when
    const data: IDataFrame<number, object> = aggregationService.compute(baseData, context);

    // then
    const expected = [
      { 'Time (per minute)': now, c1: 'a', c3: 'y', Median: 1 },
      { 'Time (per minute)': now + min, c1: 'b', c3: 'x', Median: 2 },
      { 'Time (per minute)': now + 2 * min, c1: 'b', c3: 'x', Median: 3 }
    ];
    expect(data.toArray()).toEqual(expected);
  });

  it('#compute should return MIN summary grouped by two columns followed by timeunit', () => {

    // given
    context.dataColumns = [findColumn('c2')];
    context.groupByColumns = [findColumn('c1'), findColumn('c3'), findColumn('Time', TimeUnit.MINUTE)];
    context.aggregations = [Aggregation.MIN];

    // when
    const data: IDataFrame<number, object> = aggregationService.compute(baseData, context);

    // then
    const expected = [
      { c1: 'a', c3: 'y', 'Time (per minute)': now, Min: 1 },
      { c1: 'b', c3: 'x', 'Time (per minute)': now + min, Min: 2 },
      { c1: 'b', c3: 'x', 'Time (per minute)': now + 2 * min, Min: 3 }
    ];
    expect(data.toArray()).toEqual(expected);
  });

  it('#compute should not group summary when no group-by-column is defined', () => {

    // given
    context.dataColumns = [findColumn('c2')];
    context.aggregations = [Aggregation.MIN];

    // when
    const data: IDataFrame<number, object> = aggregationService.compute(baseData, context);

    // then
    const expected = [
      { Min: 1 }
    ];
    expect(data.toArray()).toEqual(expected);
  });

  it('#aggregateValue should throw exception when aggregation is undefined', () => {
    const aggreation = {} as Aggregation;

    expect(function () { aggregationService.aggregateValue(undefined, {} as Aggregation) })
      .toThrow(new Error('aggregation of type ' + aggreation + ' is not yet implemented'));
  });

  it('#compute should key COUNT apart from data column of same name', () => {

    // given
    const data = new DataFrame([{ Count: 7 }, { Count: 5 }, { Count: 7 }]);
    context.dataColumns = [findColumn('Count')];

    // when
    const result = aggregationService.compute(data, context);

    // then
    expect(result.toArray()).toEqual([{ Count: 5, 'Count (2)': 1 }, { Count: 7, 'Count (2)': 2 }]);
  });

  it('#compute should key value aggregation apart from group-by column of same name', () => {

    // given
    const data = new DataFrame([{ Sum: 'b', c2: 2 }, { Sum: 'a', c2: 1 }, { Sum: 'b', c2: 3 }]);
    context.dataColumns = [findColumn('c2')];
    context.groupByColumns = [findColumn('Sum')];
    context.aggregations = [Aggregation.SUM, Aggregation.MAX];

    // when
    const result = aggregationService.compute(data, context);

    // then
    expect(result.toArray()).toEqual([{ Sum: 'a', 'Sum (2)': 1, Max: 1 }, { Sum: 'b', 'Sum (2)': 5, Max: 3 }]);
  });

  it('#compute should key time-grouped column apart from group-by column named like its label', () => {

    // given
    const data = new DataFrame([
      { Time: now + min + sec, 'Time (per minute)': 'x', c1: 'a' },
      { Time: now, 'Time (per minute)': 'x', c1: 'a' },
      { Time: now + 20 * sec, 'Time (per minute)': 'x', c1: 'a' }
    ]);
    context.dataColumns = [findColumn('c1')];
    context.groupByColumns = [findColumn('Time', TimeUnit.MINUTE), findColumn('Time (per minute)')];

    // when
    const result = aggregationService.compute(data, context);

    // then
    expect(result.toArray()).toEqual([
      { 'Time (per minute) (2)': now, 'Time (per minute)': 'x', c1: 'a', Count: 2 },
      { 'Time (per minute) (2)': now + min, 'Time (per minute)': 'x', c1: 'a', Count: 1 }
    ]);
  });

  it('#compute should group time column without time unit by its exact times', () => {

    // given
    const data = new DataFrame([{ Time: now + 20 * sec, c1: 'a' }, { Time: now, c1: 'a' }, { Time: now, c1: 'a' }]);
    context.dataColumns = [findColumn('c1')];
    context.groupByColumns = [findColumn('Time')];

    // when
    const result = aggregationService.compute(data, context);

    // then
    expect(result.toArray()).toEqual([{ Time: now, c1: 'a', Count: 2 }, { Time: now + 20 * sec, c1: 'a', Count: 1 }]);
  });

  it('#compute should group time column of MILLISECOND unit by its exact times', () => {

    // given
    const data = new DataFrame([{ Time: now + 2, c1: 'a' }, { Time: now + 1, c1: 'a' }, { Time: now + 1, c1: 'a' }]);
    context.dataColumns = [findColumn('c1')];
    context.groupByColumns = [findColumn('Time', TimeUnit.MILLISECOND)];

    // when
    const result = aggregationService.compute(data, context);

    // then
    expect(result.toArray()).toEqual([{ Time: now + 1, c1: 'a', Count: 2 }, { Time: now + 2, c1: 'a', Count: 1 }]);
  });

  it('#compute should group null and undefined values as one empty group placed first', () => {

    // given
    const data = new DataFrame<number, object>([{ c1: 'a' }, { c1: null }, { c3: 'x' }]);
    context.dataColumns = [findColumn('c1')];

    // when
    const result = aggregationService.compute(data, context);

    // then
    expect(result.toArray()).toEqual([{ c1: undefined, Count: 2 }, { c1: 'a', Count: 1 }]);
  });

  it('#compute should not merge values of different type', () => {

    // given
    const data = new DataFrame<number, object>([{ c1: 1 }, { c1: '1' }]);
    context.dataColumns = [findColumn('c1')];

    // when
    const result = aggregationService.compute(data, context);

    // then
    expect(result.toArray().length).toBe(2);
    expect(result.toArray()).toEqual(expect.arrayContaining([{ c1: 1, Count: 1 }, { c1: '1', Count: 1 }]));
  });

  it('#compute should group values named like object properties', () => {

    // given
    const data = new DataFrame([{ c1: 'constructor' }, { c1: '__proto__' }, { c1: 'constructor' }, { c1: 'toString' }]);
    context.dataColumns = [findColumn('c1')];

    // when
    const result = aggregationService.compute(data, context);

    // then
    expect(result.toArray()).toEqual([{ c1: '__proto__', Count: 1 }, { c1: 'constructor', Count: 2 }, { c1: 'toString', Count: 1 }]);
  });

  it('#compute should group rows lacking value of group-by column named constructor as empty group', () => {

    // given
    const data = new DataFrame<number, object>([{ constructor: 'a', Amount: 1 }, { Amount: 2 }, { Amount: 3 }]);
    context.dataColumns = [{ name: 'Amount', dataType: DataType.NUMBER, width: 10 }];
    context.groupByColumns = [{ name: 'constructor', dataType: DataType.TEXT, width: 10 }];
    context.aggregations = [Aggregation.SUM];

    // when
    const result = aggregationService.compute(data, context);

    // then
    expect(result.toArray()).toEqual([{ constructor: undefined, Sum: 5 }, { constructor: 'a', Sum: 1 }]);
  });

  it('#compute should count rows lacking value of data column named valueOf as empty value', () => {

    // given
    const data = new DataFrame<number, object>([{ valueOf: 1 }, { ID: 1 }, { ID: 2 }]);
    context.dataColumns = [{ name: 'valueOf', dataType: DataType.NUMBER, width: 10 }];
    context.aggregations = [Aggregation.COUNT];

    // when
    const result = aggregationService.compute(data, context);

    // then
    expect(result.toArray()).toEqual([{ valueOf: undefined, Count: 2 }, { valueOf: 1, Count: 1 }]);
  });

  it('#compute should return empty value aggregation for group without numbers', () => {

    // given
    const data = new DataFrame([{ c1: 'a', c2: null }, { c1: 'b', c2: 4 }]);
    context.dataColumns = [findColumn('c2')];
    context.groupByColumns = [findColumn('c1')];
    context.aggregations = [Aggregation.AVG];

    // when
    const result = aggregationService.compute(data, context);

    // then
    expect(result.toArray()).toEqual([{ c1: 'a', Average: undefined }, { c1: 'b', Average: 4 }]);
  });

  describe('in time zone with daylight saving time', () => {

    beforeEach(() => {
      Settings.defaultZone = 'Europe/Zurich';
    });

    afterEach(() => {
      Settings.defaultZone = null;
    });

    it('#compute should group times of repeated hour at end of daylight saving time into separate hours', () => {

      // given
      const data = new DataFrame([{ Time: Date.UTC(2024, 9, 27, 0, 30), c1: 'a' }, { Time: Date.UTC(2024, 9, 27, 1, 30), c1: 'a' }]);
      context.dataColumns = [findColumn('c1')];
      context.groupByColumns = [findColumn('Time', TimeUnit.HOUR)];

      // when
      const result = aggregationService.compute(data, context);

      // then
      expect(result.toArray()).toEqual([
        { 'Time (per hour)': Date.UTC(2024, 9, 27, 0), c1: 'a', Count: 1 },
        { 'Time (per hour)': Date.UTC(2024, 9, 27, 1), c1: 'a', Count: 1 }
      ]);
    });
  });

  it.each(VALUE_AGGREGATIONS)('#aggregateValue should return undefined for %s of values without numbers', aggregation => {

    // given
    const values = new Series([null, undefined, 'x']);

    // when
    const value = aggregationService.aggregateValue(values, aggregation);

    // then
    expect(value).toBeUndefined();
  });

  it('#aggregateValue should aggregate numbers among other values', () => {

    // given
    const values = new Series([1, null, 'x', 3]);

    // when
    const value = aggregationService.aggregateValue(values, Aggregation.SUM);

    // then
    expect(value).toBe(4);
  });

  it('#aggregateValue should count all values', () => {

    // given
    const values = new Series([1, null, 'x']);

    // when
    const value = aggregationService.aggregateValue(values, Aggregation.COUNT);

    // then
    expect(value).toBe(3);
  });

  function findColumn(name: string, timeUnit?: TimeUnit): Column {
    const column: Column = JSON.parse(JSON.stringify(columns.find(c => c.name === name)));
    if (timeUnit) {
      column.groupingTimeUnit = timeUnit;
    }
    return column;
  }
});
