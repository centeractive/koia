import { Aggregation, Column, DataType, SummaryContext } from 'app/shared/model';
import { AggregationService } from 'app/shared/services';
import { ValueRangeGroupingService } from 'app/shared/value-range';
import { DataFrame } from 'data-forge';
import { SummaryDataComputer } from './summary-data-computer';

describe('SummaryDataComputer', () => {

  const columns: Column[] = [
    { name: 't1', dataType: DataType.TEXT, width: 60, indexed: true },
    { name: 'n1', dataType: DataType.NUMBER, width: 80, indexed: true }
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

  it('#aggregate should apply value groupings before aggregating', () => {

    // given
    context.dataColumns = [columns[1]];
    context.valueGroupings = [{ columnName: 'n1', ranges: [{ max: 2, active: true }] }];

    // when
    const dataFrame = computer.aggregate(baseDataFrame, context);

    // then
    expect(dataFrame.toArray()).toEqual([
      { n1: '2 - max', Count: 3 },
      { n1: 'min - 2', Count: 1 }
    ]);
  });

  it('#aggregate should aggregate by group-by columns', () => {

    // given
    context.dataColumns = [columns[1]];
    context.groupByColumns = [columns[0]];

    // when
    const dataFrame = computer.aggregate(baseDataFrame, context);

    // then
    expect(dataFrame.toArray()).toEqual([
      { t1: 'a', n1: 1, Count: 1 },
      { t1: 'b', n1: 2, Count: 2 },
      { t1: 'b', n1: 3, Count: 1 }
    ]);
  });

  it('#overallsOf should sum counts', () => {

    // given
    const dataFrame = new DataFrame([{ Count: 1 }, { Count: 3 }]);

    // when
    const overalls = computer.overallsOf(dataFrame, context);

    // then
    expect(overalls).toEqual([4]);
  });

  it('#overallsOf should aggregate values with their aggregation', () => {

    // given
    context.aggregations = [Aggregation.MIN, Aggregation.MAX];
    const dataFrame = new DataFrame([{ Min: 1, Max: 5 }, { Min: 2, Max: 9 }]);

    // when
    const overalls = computer.overallsOf(dataFrame, context);

    // then
    expect(overalls).toEqual([1, 9]);
  });
});
