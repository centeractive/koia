import { Aggregation, Column, DataType, TimeUnit } from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { AggregatedSeriesFactory } from './aggregated-series-factory';

describe('AggregatedSeriesFactory', () => {

  const day = 24 * 60 * 60 * 1000;
  const day1 = new Date(2026, 0, 1).getTime();
  const day2 = day1 + day;

  let factory: AggregatedSeriesFactory;
  let context: ChartContext;

  beforeEach(() => {
    factory = new AggregatedSeriesFactory();
    context = new ChartContext([], ChartType.LINE.type, { top: 0, right: 0, bottom: 0, left: 0 });
    context.entries = [
      { Time: day1 + 1_000, Region: 'East', Amount: 10, Discount: 1 },
      { Time: day2 + 1_000, Region: 'East', Amount: 30, Discount: 3 },
      { Time: day1 + 2_000, Region: 'West', Amount: 5, Discount: 2 },
      { Time: day1 + 3_000, Region: 'East', Amount: 20, Discount: 4 }
    ];
    context.groupByColumns = [createColumn('Time', DataType.TIME, TimeUnit.DAY)];
  });

  it('#create should sum values per time unit for each split series', () => {

    // given
    context.dataColumns = [createColumn('Amount', DataType.NUMBER)];
    context.splitColumns = [createColumn('Region', DataType.TEXT)];
    context.aggregations = [Aggregation.SUM];

    // when
    const datasets = factory.create(context);

    // then
    expect(datasets).toEqual([
      { key: 'East ⯈ Amount', values: [{ x: day1, y: 30 }, { x: day2, y: 30 }] },
      { key: 'West ⯈ Amount', values: [{ x: day1, y: 5 }] }
    ]);
  });

  it('#create should compute AVG, MEDIAN, MIN and MAX per time unit', () => {

    // given
    context.entries = [
      { Time: day1, Amount: 1 },
      { Time: day1 + 1_000, Amount: 2 },
      { Time: day1 + 2_000, Amount: 6 }
    ];
    context.dataColumns = [createColumn('Amount', DataType.NUMBER)];
    const aggregations = [Aggregation.AVG, Aggregation.MEDIAN, Aggregation.MIN, Aggregation.MAX];

    // when
    const values = aggregations.map(a => {
      context.aggregations = [a];
      return factory.create(context)[0].values[0].y;
    });

    // then
    expect(values).toEqual([3, 2, 1, 6]);
  });

  it('#create should create one series per data column in column order', () => {

    // given
    context.dataColumns = [createColumn('Discount', DataType.NUMBER), createColumn('Amount', DataType.NUMBER)];
    context.aggregations = [Aggregation.MAX];

    // when
    const datasets = factory.create(context);

    // then
    expect(datasets).toEqual([
      { key: 'Discount', values: [{ x: day1, y: 4 }, { x: day2, y: 3 }] },
      { key: 'Amount', values: [{ x: day1, y: 20 }, { x: day2, y: 30 }] }
    ]);
  });

  it('#create should keep series of data column without values', () => {

    // given
    context.dataColumns = [createColumn('Missing', DataType.NUMBER), createColumn('Amount', DataType.NUMBER)];
    context.aggregations = [Aggregation.SUM];

    // when
    const datasets = factory.create(context);

    // then
    expect(datasets.map(ds => ds.key)).toEqual(['Missing', 'Amount']);
    expect(datasets[0].values).toEqual([]);
  });

  it('#create should count rows per time unit as single series named row count', () => {

    // given
    context.aggregations = [Aggregation.ROW_COUNT];

    // when
    const datasets = factory.create(context);

    // then
    expect(datasets).toEqual([{ key: 'Row Count', values: [{ x: day1, y: 3 }, { x: day2, y: 1 }] }]);
  });

  it('#create should count rows per time unit for each split series', () => {

    // given
    context.splitColumns = [createColumn('Region', DataType.TEXT)];
    context.aggregations = [Aggregation.ROW_COUNT];

    // when
    const datasets = factory.create(context);

    // then
    expect(datasets).toEqual([
      { key: 'East', values: [{ x: day1, y: 2 }, { x: day2, y: 1 }] },
      { key: 'West', values: [{ x: day1, y: 1 }] }
    ]);
  });

  it('#create should ignore entries with empty split value', () => {

    // given
    context.entries = [
      { Time: day1, Region: 'East' },
      { Time: day1, Region: '' },
      { Time: day1 }
    ];
    context.splitColumns = [createColumn('Region', DataType.TEXT)];
    context.aggregations = [Aggregation.ROW_COUNT];

    // when
    const datasets = factory.create(context);

    // then
    expect(datasets).toEqual([{ key: 'East', values: [{ x: day1, y: 1 }] }]);
  });

  it('#create should ignore entries without group-by value', () => {

    // given
    context.entries = [
      { Time: day1, Amount: 1 },
      { Time: null, Amount: 2 },
      { Amount: 3 }
    ];
    context.dataColumns = [createColumn('Amount', DataType.NUMBER)];
    context.aggregations = [Aggregation.SUM];

    // when
    const datasets = factory.create(context);

    // then
    expect(datasets).toEqual([{ key: 'Amount', values: [{ x: day1, y: 1 }] }]);
  });

  it('#create should ignore non-numeric values', () => {

    // given
    context.entries = [
      { Time: day1, Amount: 1 },
      { Time: day1, Amount: 'n/a' },
      { Time: day1, Amount: null },
      { Time: day1, Amount: 2 }
    ];
    context.dataColumns = [createColumn('Amount', DataType.NUMBER)];
    context.aggregations = [Aggregation.AVG];

    // when
    const datasets = factory.create(context);

    // then
    expect(datasets).toEqual([{ key: 'Amount', values: [{ x: day1, y: 1.5 }] }]);
  });

  it('#create should aggregate per distinct time when time unit is undefined', () => {

    // given
    context.entries = [
      { Time: day1 + 1, Amount: 1 },
      { Time: day1, Amount: 2 },
      { Time: day1 + 1, Amount: 3 }
    ];
    context.groupByColumns = [createColumn('Time', DataType.TIME)];
    context.dataColumns = [createColumn('Amount', DataType.NUMBER)];
    context.aggregations = [Aggregation.SUM];

    // when
    const datasets = factory.create(context);

    // then
    expect(datasets).toEqual([{ key: 'Amount', values: [{ x: day1, y: 2 }, { x: day1 + 1, y: 4 }] }]);
  });

  it('#create should sort data points by number group-by value', () => {

    // given
    context.entries = [
      { Level: 3, Amount: 1 },
      { Level: 1, Amount: 2 },
      { Level: 2, Amount: 3 }
    ];
    context.groupByColumns = [createColumn('Level', DataType.NUMBER)];
    context.dataColumns = [createColumn('Amount', DataType.NUMBER)];
    context.aggregations = [Aggregation.SUM];

    // when
    const datasets = factory.create(context);

    // then
    expect(datasets[0].values.map(p => p.x)).toEqual([1, 2, 3]);
  });

  it('#create should keep first appearance order for text group-by values', () => {

    // given
    context.groupByColumns = [createColumn('Region', DataType.TEXT)];
    context.aggregations = [Aggregation.ROW_COUNT];

    // when
    const datasets = factory.create(context);

    // then
    expect(datasets).toEqual([{ key: 'Row Count', values: [{ x: 'East', y: 3 }, { x: 'West', y: 1 }] }]);
  });

  function createColumn(name: string, dataType: DataType, groupingTimeUnit?: TimeUnit): Column {
    return { name, dataType, width: 10, groupingTimeUnit };
  }
});
