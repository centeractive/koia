import { Aggregation, Column, DataType, SummaryContext, TimeUnit } from '../model';
import { AggregationKeys } from './aggregation-keys';

describe('AggregationKeys', () => {

  const time: Column = { name: 'Time', dataType: DataType.TIME, width: 100, groupingTimeUnit: TimeUnit.MINUTE };
  const t1: Column = { name: 't1', dataType: DataType.TEXT, width: 100 };
  const n1: Column = { name: 'n1', dataType: DataType.NUMBER, width: 100 };
  const count: Column = { name: 'Count', dataType: DataType.NUMBER, width: 100 };
  const sum: Column = { name: 'Sum', dataType: DataType.TEXT, width: 100 };
  const sum2: Column = { name: 'Sum (2)', dataType: DataType.TEXT, width: 100 };
  const timeLabel: Column = { name: 'Time (per minute)', dataType: DataType.TEXT, width: 100 };
  const timeNamedCount: Column = { name: 'Count', dataType: DataType.TIME, width: 100, groupingTimeUnit: TimeUnit.MINUTE };

  let context: SummaryContext;

  beforeEach(() => {
    context = new SummaryContext([]);
  });

  it('#groupBy should be names of group-by columns and labels of time-grouped columns', () => {

    // given
    context.groupByColumns = [time, t1];

    // when
    const keys = new AggregationKeys(context);

    // then
    expect(keys.groupBy).toEqual(['Time (per minute)', 't1']);
  });

  it('#groupBy should suffix label of time-grouped column taken by group-by column', () => {

    // given
    context.groupByColumns = [time, timeLabel];

    // when
    const keys = new AggregationKeys(context);

    // then
    expect(keys.groupBy).toEqual(['Time (per minute) (2)', 'Time (per minute)']);
  });

  it('#data should be name of data column when counting', () => {

    // given
    context.dataColumns = [n1];

    // when
    const keys = new AggregationKeys(context);

    // then
    expect(keys.data).toBe('n1');
  });

  it('#data should be undefined when aggregating values', () => {

    // given
    context.dataColumns = [n1];
    context.aggregations = [Aggregation.SUM];

    // when
    const keys = new AggregationKeys(context);

    // then
    expect(keys.data).toBeUndefined();
  });

  it('#data should be undefined when counting without data column', () => {

    // given
    context.groupByColumns = [t1];

    // when
    const keys = new AggregationKeys(context);

    // then
    expect(keys.data).toBeUndefined();
  });

  it('#aggregations should be names of aggregations when not taken', () => {

    // given
    context.dataColumns = [n1];
    context.aggregations = [Aggregation.AVG, Aggregation.MAX];

    // when
    const keys = new AggregationKeys(context);

    // then
    expect(keys.aggregations).toEqual(['Average', 'Max']);
  });

  it('#aggregations should suffix COUNT taken by data column', () => {

    // given
    context.dataColumns = [count];

    // when
    const keys = new AggregationKeys(context);

    // then
    expect(keys.aggregations).toEqual(['Count (2)']);
  });

  it('#aggregations should suffix value aggregation taken by group-by column', () => {

    // given
    context.dataColumns = [n1];
    context.groupByColumns = [sum];
    context.aggregations = [Aggregation.SUM, Aggregation.MIN];

    // when
    const keys = new AggregationKeys(context);

    // then
    expect(keys.aggregations).toEqual(['Sum (2)', 'Min']);
  });

  it('#aggregations should suffix next free number', () => {

    // given
    context.dataColumns = [n1];
    context.groupByColumns = [sum, sum2];
    context.aggregations = [Aggregation.SUM];

    // when
    const keys = new AggregationKeys(context);

    // then
    expect(keys.aggregations).toEqual(['Sum (3)']);
  });

  it('#aggregations should not suffix name of time-grouped column', () => {

    // given
    context.groupByColumns = [timeNamedCount];
    context.dataColumns = [t1];

    // when
    const keys = new AggregationKeys(context);

    // then
    expect(keys.groupBy).toEqual(['Count (per minute)']);
    expect(keys.aggregations).toEqual(['Count']);
  });

  it('#leading should be group-by keys followed by data key when counting', () => {

    // given
    context.groupByColumns = [time];
    context.dataColumns = [t1];

    // when
    const keys = new AggregationKeys(context);

    // then
    expect(keys.leading).toEqual(['Time (per minute)', 't1']);
  });

  it('#leading should be group-by keys when aggregating values', () => {

    // given
    context.groupByColumns = [t1];
    context.dataColumns = [n1];
    context.aggregations = [Aggregation.SUM];

    // when
    const keys = new AggregationKeys(context);

    // then
    expect(keys.leading).toEqual(['t1']);
  });

  it('#leadingLabels should be unsuffixed labels of leading columns', () => {

    // given
    context.groupByColumns = [time, timeLabel];
    context.dataColumns = [t1];

    // when
    const keys = new AggregationKeys(context);

    // then
    expect(keys.leadingLabels).toEqual(['Time (per minute)', 'Time (per minute)', 't1']);
  });

  it('#all should be leading keys followed by aggregation keys', () => {

    // given
    context.groupByColumns = [t1];
    context.dataColumns = [count];

    // when
    const keys = new AggregationKeys(context);

    // then
    expect(keys.all).toEqual(['t1', 'Count', 'Count (2)']);
  });

  it('#isColumnName should be true for names of group-by and data columns', () => {

    // given
    context.groupByColumns = [time, t1];
    context.dataColumns = [n1];

    // when
    const keys = new AggregationKeys(context);

    // then
    expect(keys.isColumnName('t1')).toBe(true);
    expect(keys.isColumnName('n1')).toBe(true);
  });

  it('#isColumnName should be false for keys of time-grouped columns and aggregations', () => {

    // given
    context.groupByColumns = [time, t1];
    context.dataColumns = [n1];

    // when
    const keys = new AggregationKeys(context);

    // then
    expect(keys.isColumnName('Time (per minute)')).toBe(false);
    expect(keys.isColumnName('Count')).toBe(false);
  });
});
