import { AggregationService } from './aggregation.service';
import { SummaryContext, Aggregation, DataType, Column, TimeUnit } from 'app/shared/model';
import { IDataFrame, DataFrame } from 'data-forge';

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
      { name: 'c3', dataType: DataType.TEXT, width: 100 }
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
    const data: IDataFrame<number, any> = aggregationService.compute(baseData, context);

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
    const data: IDataFrame<number, any> = aggregationService.compute(baseData, context);

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
    const data: IDataFrame<number, any> = aggregationService.compute(baseData, context);

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
    const data: IDataFrame<number, any> = aggregationService.compute(baseData, context);

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
    const data: IDataFrame<number, any> = aggregationService.compute(baseData, context);

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
    const data: IDataFrame<number, any> = aggregationService.compute(baseData, context);

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
    const data: IDataFrame<number, any> = aggregationService.compute(baseData, context);

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
    const data: IDataFrame<number, any> = aggregationService.compute(baseData, context);

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
    const data: IDataFrame<number, any> = aggregationService.compute(baseData, context);

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
    const data: IDataFrame<number, any> = aggregationService.compute(baseData, context);

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
    const data: IDataFrame<number, any> = aggregationService.compute(baseData, context);

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
    const data: IDataFrame<number, any> = aggregationService.compute(baseData, context);

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
    const data: IDataFrame<number, any> = aggregationService.compute(baseData, context);

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
    const data: IDataFrame<number, any> = aggregationService.compute(baseData, context);

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
    const data: IDataFrame<number, any> = aggregationService.compute(baseData, context);

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
    const data: IDataFrame<number, any> = aggregationService.compute(baseData, context);

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
    const data: IDataFrame<number, any> = aggregationService.compute(baseData, context);

    // then
    const expected = [
      { Min: 1 }
    ];
    expect(data.toArray()).toEqual(expected);
  });

  it('#aggregateValue should throw exception when aggregation is undefined', () => {
    const aggreation = <Aggregation>{};
    expect(function () { aggregationService.aggregateValue(undefined, <Aggregation>{}) })
      .toThrow(new Error('aggregation of type ' + aggreation + ' is not yet implemented'));
  });

  function findColumn(name: string, timeUnit?: TimeUnit): Column {
    const column: Column = JSON.parse(JSON.stringify(columns.find(c => c.name === name)));
    if (timeUnit) {
      column.groupingTimeUnit = timeUnit;
    }
    return column;
  }
});
