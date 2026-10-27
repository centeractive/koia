import { Aggregation, Column, DataType, SummaryContext, TimeUnit } from 'app/shared/model';
import { ChartType, Margin } from 'app/shared/model/chart';
import { GraphContext } from 'app/shared/model/graph';
import { ChartMarginService } from 'app/shared/services/chart/chart-margin.service';
import { ValueGroupingGenerator } from 'app/shared/value-range/value-grouping-generator';
import { DataFrame } from 'data-forge';
import { ColumnProfile, ColumnRole } from './column-profile';
import { TileContextFactory } from './tile-context-factory';
import { TileSignature } from './tile-signature';
import { TileSize, TileSpec } from './tile-spec';

describe('TileContextFactory', () => {

  const T0 = new Date(2024, 0, 1).getTime();
  const LEVEL: ColumnProfile = { name: 'Level', dataType: DataType.TEXT, role: ColumnRole.CATEGORY, distinctCount: 2, presentCount: 4 };
  const REGION: ColumnProfile = { name: 'Region', dataType: DataType.TEXT, role: ColumnRole.CATEGORY, distinctCount: 2, presentCount: 4 };
  const AMOUNT: ColumnProfile = { name: 'Amount', dataType: DataType.NUMBER, role: ColumnRole.MEASURE, distinctCount: 4, presentCount: 4 };
  const PRICE: ColumnProfile = { name: 'Price', dataType: DataType.NUMBER, role: ColumnRole.MEASURE, distinctCount: 4, presentCount: 4 };
  const TIME: ColumnProfile = {
    name: 'Time', dataType: DataType.TIME, role: ColumnRole.TIME, distinctCount: 4, presentCount: 4, groupingTimeUnit: TimeUnit.MONTH
  };
  const ENTRIES = [
    { Level: 'INFO', Region: 'North', Amount: 10, Price: 1.5, Time: T0 },
    { Level: 'WARN', Region: 'South', Amount: 20, Price: 2.5, Time: new Date(2024, 1, 1).getTime() },
    { Level: 'INFO', Region: 'South', Amount: 35, Price: 3.5, Time: new Date(2024, 2, 1).getTime() },
    { Level: 'WARN', Region: 'North', Amount: 140, Price: 4.5, Time: new Date(2024, 3, 1).getTime() }
  ];

  let chartMarginService: ChartMarginService;
  let factory: TileContextFactory;
  let columns: Column[];

  beforeEach(() => {
    chartMarginService = new ChartMarginService();
    factory = new TileContextFactory(chartMarginService);
    columns = [LEVEL, REGION, AMOUNT, PRICE, TIME].map(p => ({ name: p.name, dataType: p.dataType, width: 10 }));
  });

  function specOf(fields: Partial<TileSpec> & Pick<TileSpec, 'dataColumns' | 'aggregations'>): TileSpec {
    const groupByColumns = fields.groupByColumns ?? [];
    const splitColumns = fields.splitColumns ?? [];
    const kind = fields.chartType ? 'chart' : TileSignature.summaryKind(fields.aggregations.join() === Aggregation.COUNT);
    const signature = TileSignature.of(kind, [...fields.dataColumns, ...groupByColumns, ...splitColumns].map(c => c.name));
    return {
      signature,
      key: TileSignature.keyOf(signature, fields.chartType?.type),
      groupByColumns,
      splitColumns,
      aggregationChoices: [],
      stacked: false,
      multiValueAxes: false,
      showLegend: false,
      legendPosition: 'top',
      size: TileSize.WIDE,
      timeChart: false,
      ...fields
    };
  }

  function namesOf(columns: Column[]): string[] {
    return columns.map(c => c.name);
  }

  it('#createChart should create chart context with columns, aggregations and options of spec', () => {

    // given
    const countOverTime = specOf({
      chartType: ChartType.AREA, dataColumns: [LEVEL], groupByColumns: [TIME], aggregations: [Aggregation.COUNT], stacked: true,
      showLegend: true, legendPosition: 'right', timeChart: true
    });
    const valuesOverTime = specOf({
      chartType: ChartType.LINE, dataColumns: [AMOUNT, PRICE], groupByColumns: [TIME], aggregations: [], multiValueAxes: true,
      showLegend: true
    });
    const scatter = specOf({
      chartType: ChartType.SCATTER, dataColumns: [AMOUNT], groupByColumns: [PRICE], splitColumns: [LEVEL], aggregations: [],
      showLegend: true
    });
    const distribution = specOf({
      chartType: ChartType.PIE, dataColumns: [REGION], aggregations: [Aggregation.COUNT], showLegend: true, legendPosition: 'right',
      size: TileSize.SMALL
    });

    // when
    const contexts = [countOverTime, valuesOverTime, scatter, distribution].map(s => factory.createChart(s, columns, ENTRIES));

    // then
    expect(contexts.map(c => c.chartType)).toEqual(['area', 'line', 'scatter', 'pie']);
    expect(contexts.map(c => namesOf(c.dataColumns))).toEqual([['Level'], ['Amount', 'Price'], ['Amount'], ['Region']]);
    expect(contexts.map(c => namesOf(c.groupByColumns))).toEqual([['Time'], ['Time'], ['Price'], []]);
    expect(contexts.map(c => namesOf(c.splitColumns))).toEqual([[], [], ['Level'], []]);
    expect(contexts.map(c => c.aggregations)).toEqual([[Aggregation.COUNT], [], [], [Aggregation.COUNT]]);
    expect(contexts.map(c => c.stacked)).toEqual([true, false, false, false]);
    expect(contexts.map(c => c.multiValueAxes)).toEqual([false, true, false, false]);
    expect(contexts.map(c => c.showLegend)).toEqual([true, true, true, true]);
    expect(contexts.map(c => c.legendPosition)).toEqual(['right', 'top', 'top', 'right']);
    contexts.forEach(c => {
      expect(c.columns).toBe(columns);
      [...c.dataColumns, ...c.groupByColumns, ...c.splitColumns].forEach(col => expect(columns).toContain(col));
    });
  });

  it('#createChart should set grouping time unit of profile on time column', () => {

    // given
    const spec = specOf({ chartType: ChartType.LINE, dataColumns: [LEVEL], groupByColumns: [TIME], aggregations: [Aggregation.COUNT] });

    // when
    const context = factory.createChart(spec, columns, ENTRIES);

    // then
    expect(context.groupByColumns[0].groupingTimeUnit).toBe(TimeUnit.MONTH);
    expect(columns.find(c => c.name === 'Time').groupingTimeUnit).toBe(TimeUnit.MONTH);
  });

  it('#createChart should create row count chart context without data column', () => {

    // given
    const spec = specOf({
      chartType: ChartType.LINE, dataColumns: [], groupByColumns: [TIME], aggregations: [Aggregation.ROW_COUNT], timeChart: true
    });

    // when
    const context = factory.createChart(spec, columns, ENTRIES);

    // then
    expect(context.dataColumns).toEqual([]);
    expect(context.aggregations).toEqual([Aggregation.ROW_COUNT]);
    expect(context.isRowCountSelected()).toBe(true);
    expect(context.isAggregatedChart()).toBe(true);
    expect(context.isDataDefined()).toBe(true);
    expect(context.groupByColumns[0].groupingTimeUnit).toBe(TimeUnit.MONTH);
  });

  it('#createChart should create aggregated time chart context of value aggregation', () => {

    // given
    const spec = specOf({
      chartType: ChartType.AREA, dataColumns: [AMOUNT], groupByColumns: [TIME], splitColumns: [LEVEL], aggregations: [Aggregation.SUM],
      showLegend: true, timeChart: true
    });

    // when
    const context = factory.createChart(spec, columns, ENTRIES);

    // then
    expect(namesOf(context.dataColumns)).toEqual(['Amount']);
    expect(namesOf(context.splitColumns)).toEqual(['Level']);
    expect(context.getValueAggregation()).toBe(Aggregation.SUM);
    expect(context.isAggregatedChart()).toBe(true);
    expect(context.groupByColumns[0].groupingTimeUnit).toBe(TimeUnit.MONTH);
  });

  it('#createChart should take chart margin of chart type', () => {

    // given
    const margin: Margin = { top: 1, right: 2, bottom: 3, left: 4 };
    const marginOfSpy = vi.spyOn(chartMarginService, 'marginOf').mockReturnValue(margin);
    const spec = specOf({ chartType: ChartType.DOUGHNUT, dataColumns: [LEVEL], aggregations: [Aggregation.COUNT] });

    // when
    const context = factory.createChart(spec, columns, ENTRIES);

    // then
    expect(marginOfSpy).toHaveBeenCalledWith(ChartType.DOUGHNUT);
    expect(context.margin).toBe(margin);
  });

  it('#createChart should set entries', () => {

    // given
    const spec = specOf({ chartType: ChartType.BAR, dataColumns: [LEVEL], aggregations: [Aggregation.COUNT] });

    // when
    const context = factory.createChart(spec, columns, ENTRIES);

    // then
    expect(context.entries).toBe(ENTRIES);
  });

  it('#createSummary should create summary context with group-by columns and aggregations', () => {

    // given
    const spec = specOf({ dataColumns: [AMOUNT], groupByColumns: [REGION, LEVEL], aggregations: [Aggregation.SUM, Aggregation.AVG] });

    // when
    const context = factory.createSummary(spec, columns, ENTRIES);

    // then
    expect(context).toBeInstanceOf(SummaryContext);
    expect(context.columns).toBe(columns);
    expect(namesOf(context.dataColumns)).toEqual(['Amount']);
    expect(namesOf(context.groupByColumns)).toEqual(['Region', 'Level']);
    expect(context.aggregations).toEqual([Aggregation.SUM, Aggregation.AVG]);
    expect(context.valueGroupings).toEqual([]);
    [...context.dataColumns, ...context.groupByColumns].forEach(c => expect(columns).toContain(c));
  });

  it('#createSummary should set grouping time unit of profile on time column', () => {

    // given
    const spec = specOf({ dataColumns: [AMOUNT], groupByColumns: [TIME], aggregations: [Aggregation.SUM] });

    // when
    const context = factory.createSummary(spec, columns, ENTRIES);

    // then
    expect(context.groupByColumns[0].groupingTimeUnit).toBe(TimeUnit.MONTH);
  });

  it('#createSummary should add value grouping of measure to value range summary', () => {

    // given
    const spec = specOf({ dataColumns: [AMOUNT], groupByColumns: [LEVEL], aggregations: [Aggregation.COUNT], valueGroupingColumn: AMOUNT });

    // when
    const context = factory.createSummary(spec, columns, ENTRIES);

    // then
    expect(context.valueGroupings).toEqual([new ValueGroupingGenerator().createGrouping(new DataFrame(ENTRIES), 'Amount')]);
    expect(context.valueGroupings[0].columnName).toBe('Amount');
    expect(context.aggregations).toEqual([Aggregation.COUNT]);
  });

  it('#createSummary should set entries', () => {

    // given
    const spec = specOf({ dataColumns: [AMOUNT], groupByColumns: [LEVEL], aggregations: [Aggregation.SUM] });

    // when
    const context = factory.createSummary(spec, columns, ENTRIES);

    // then
    expect(context.entries).toBe(ENTRIES);
  });

  it('#applyColumnSpan should span given columns of one row', () => {

    // given
    const context = new SummaryContext(columns);
    context.gridColumnSpan = 3;
    context.gridRowSpan = 2;

    // when
    factory.applyColumnSpan(context, 4);

    // then
    expect([context.gridColumnSpan, context.gridRowSpan]).toEqual([4, 1]);
  });

  it('#applyColumnSpan should not change size', () => {

    // given
    const context = new SummaryContext(columns);
    context.setSize(700, 300);
    const setSizeSpy = vi.spyOn(context, 'setSize');

    // when
    factory.applyColumnSpan(context, 5);

    // then
    expect(setSizeSpy).not.toHaveBeenCalled();
    expect([context.width, context.height]).toEqual([700, 300]);
  });
  it('#createGraph should create graph context with group-by columns and entries', () => {

    // when
    const context = factory.createGraph([REGION, LEVEL], columns, ENTRIES);

    // then
    expect(context).toBeInstanceOf(GraphContext);
    expect(context.columns).toBe(columns);
    expect(namesOf(context.groupByColumns)).toEqual(['Region', 'Level']);
    context.groupByColumns.forEach(c => expect(columns).toContain(c));
    expect(context.dataColumns).toEqual([]);
    expect(context.entries).toBe(ENTRIES);
  });

});
