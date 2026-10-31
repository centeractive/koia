import { Aggregation, Column, DataType, SummaryContext } from 'app/shared/model';
import { AggregationService } from 'app/shared/services';
import { ValueRangeGroupingService } from 'app/shared/value-range';
import { DataFrame } from 'data-forge';
import { SummaryDataComputer } from './summary-data-computer';

describe('SummaryDataComputer', () => {

  const columns: Column[] = [
    { name: 't1', dataType: DataType.TEXT, width: 60, indexed: true },
    { name: 'n1', dataType: DataType.NUMBER, width: 80, indexed: true },
    { name: 'Count', dataType: DataType.NUMBER, width: 80, indexed: true }
  ];
  const baseDataFrame = new DataFrame([
    { t1: 'a', n1: 1 },
    { t1: 'b', n1: 2 },
    { t1: 'b', n1: 3 },
    { t1: 'b', n1: 2 }
  ]);
  const computer = new SummaryDataComputer(new AggregationService(), new ValueRangeGroupingService());
  let context: SummaryContext;

  beforeEach(() => {
    context = new SummaryContext(columns);
  });

  it('#compute should apply value groupings before aggregating', () => {

    // given
    context.dataColumns = [columns[1]];
    context.valueGroupings = [{ columnName: 'n1', ranges: [{ max: 2, active: true }] }];

    // when
    const { dataFrame } = computer.compute(baseDataFrame, context);

    // then
    expect(dataFrame.toArray()).toEqual([
      { n1: '2 - max', Count: 3 },
      { n1: 'min - 2', Count: 1 }
    ]);
  });

  it('#compute should aggregate by group-by columns', () => {

    // given
    context.dataColumns = [columns[1]];
    context.groupByColumns = [columns[0]];

    // when
    const { dataFrame } = computer.compute(baseDataFrame, context);

    // then
    expect(dataFrame.toArray()).toEqual([
      { t1: 'a', n1: 1, Count: 1 },
      { t1: 'b', n1: 2, Count: 2 },
      { t1: 'b', n1: 3, Count: 1 }
    ]);
  });

  it('#compute should count all rows as overall COUNT', () => {

    // given
    context.dataColumns = [columns[1]];
    context.groupByColumns = [columns[0]];

    // when
    const { overalls } = computer.compute(baseDataFrame, context);

    // then
    expect(overalls).toEqual([4]);
  });

  it('#compute should compute overall average of all rows instead of average of group averages', () => {

    // given
    context.dataColumns = [columns[1]];
    context.groupByColumns = [columns[0]];
    context.aggregations = [Aggregation.AVG];

    // when
    const { overalls } = computer.compute(baseDataFrame, context);

    // then
    expect(overalls).toEqual([2]);
  });

  it('#compute should compute overall median of all rows instead of median of group medians', () => {

    // given
    context.dataColumns = [columns[1]];
    context.groupByColumns = [columns[0]];
    context.aggregations = [Aggregation.MEDIAN];

    // when
    const { overalls } = computer.compute(baseDataFrame, context);

    // then
    expect(overalls).toEqual([2]);
  });

  it('#compute should return undefined overall of value aggregation without numbers', () => {

    // given
    const base = new DataFrame([{ t1: 'a', n1: null }]);
    context.dataColumns = [columns[1]];
    context.groupByColumns = [columns[0]];
    context.aggregations = [Aggregation.SUM];

    // when
    const { overalls } = computer.compute(base, context);

    // then
    expect(overalls).toEqual([undefined]);
  });

  it('#compute should count overall of aggregation whose key is taken by data column', () => {

    // given
    const base = new DataFrame([{ Count: 5 }, { Count: 7 }, { Count: 7 }]);
    context.dataColumns = [columns[2]];

    // when
    const { dataFrame, overalls } = computer.compute(base, context);

    // then
    expect(dataFrame.toArray()).toEqual([{ Count: 5, 'Count (2)': 1 }, { Count: 7, 'Count (2)': 2 }]);
    expect(overalls).toEqual([3]);
  });
});
