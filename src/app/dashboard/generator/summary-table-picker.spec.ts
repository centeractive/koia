import { Aggregation, Column, DataType, SummaryContext } from 'app/shared/model';
import { ChartMarginService } from 'app/shared/services/chart/chart-margin.service';
import { categoryProfile as category, measureProfile as measure } from 'app/shared/test';
import { SummaryTableSizeEstimator, TableEstimate } from 'app/summary-table/summary-table-size-estimator';
import { GenerationRequest } from './dashboard-generator';
import { SummaryTablePicker } from './summary-table-picker';
import { TileContextFactory } from './tile-context-factory';
import { TileSize, TileSpec } from './tile-spec';
import { tileSpecOf } from './tile-spec-builder';

describe('SummaryTablePicker', () => {

  const { SUM, AVG, MEDIAN, MIN, MAX } = Aggregation;
  const COLUMNS: Column[] = [
    { name: 'C', dataType: DataType.TEXT, width: 10 },
    ...Array.from({ length: 8 }, (_, i) => ({ name: 'N' + (i + 1), dataType: DataType.NUMBER, width: 10 }))
  ];

  let factory: TileContextFactory;
  let estimator: SummaryTableSizeEstimator;
  let picker: SummaryTablePicker;
  let estimates: Map<string, (context: SummaryContext) => TableEstimate>;

  beforeEach(() => {
    factory = new TileContextFactory(new ChartMarginService());
    estimator = new SummaryTableSizeEstimator();
    estimates = new Map();
    vi.spyOn(estimator, 'estimate').mockImplementation(context => estimates.get(context.dataColumns[0].name)(context));
    picker = new SummaryTablePicker(factory, estimator);
  });

  afterEach(() => vi.restoreAllMocks());

  function specOf(name: string, aggregations: Aggregation[] = [SUM], aggregationChoices: Aggregation[][] = []): TileSpec {
    return tileSpecOf({ dataColumns: [measure(name)], groupByColumns: [category('C', 3)], aggregations, aggregationChoices,
      size: TileSize.WIDE });
  }

  function estimateOf(name: string, width: number, height: number, aggregationWidths?: number[]): void {
    estimates.set(name, context => ({ width, height, aggregationWidths: aggregationWidths ?? context.aggregations.map(() => 0) }));
  }

  function requestOf(containerWidth = 1000): GenerationRequest {
    return {
      columns: () => COLUMNS.map(c => ({ ...c })), entries: [], currentContexts: [], currentGrid: { columns: 4, cellRatio: '1:1' },
      containerWidth
    };
  }

  it('#pick should return undefined without candidates', () => {

    // when
    const picked = picker.pick([], requestOf(), 4);

    // then
    expect(picked).toBeUndefined();
  });

  it('#pick should estimate at most the maximum number of candidates', () => {

    // given
    const specs = COLUMNS.slice(1).map(c => specOf(c.name));
    specs.forEach(s => estimateOf(s.dataColumns[0].name, 100, 100));

    // when
    picker.pick(specs, requestOf(), 4);

    // then
    expect(estimator.estimate).toHaveBeenCalledTimes(SummaryTablePicker.MAX_CANDIDATES);
  });

  it('#pick should pick candidate whose estimate best fills its tile', () => {

    // given
    estimateOf('N1', 100, 50);
    estimateOf('N2', 230, 170);
    estimateOf('N3', 480, 300);

    // when
    const picked = picker.pick([specOf('N1'), specOf('N2'), specOf('N3')], requestOf(), 4);

    // then
    expect(picked.spec.dataColumns[0].name).toBe('N2');
    expect(picked.context.dataColumns[0].name).toBe('N2');
    expect(picked.size).toBe(TileSize.SMALL);
    expect(picked.score).toBeCloseTo(230 / 240 * 170 / 176, 10);
  });

  it('#pick should score table exceeding tile height like equally empty tile', () => {

    // given
    estimateOf('N1', 240, 2 * 176);
    estimateOf('N2', 240, 176 / 2);

    // when
    const exceeding = picker.pick([specOf('N1')], requestOf(), 4);
    const empty = picker.pick([specOf('N2')], requestOf(), 4);

    // then
    expect(exceeding.score).toBe(0.5);
    expect(empty.score).toBe(0.5);
  });

  it('#pick should give one cell to table fitting cell width', () => {

    // given
    estimateOf('N1', 240, 100);

    // when
    const picked = picker.pick([specOf('N1')], requestOf(), 4);

    // then
    expect(picked.size).toBe(TileSize.SMALL);
  });

  it('#pick should give two cells to table exceeding cell width', () => {

    // given
    estimateOf('N1', 241, 100);

    // when
    const picked = picker.pick([specOf('N1')], requestOf(), 4);

    // then
    expect(picked.size).toBe(TileSize.WIDE);
  });

  it('#pick should choose aggregation set whose width best fills the tile', () => {

    // given
    estimateOf('N1', 400, 170, [60, 60, 60, 60, 60]);
    const spec = specOf('N1', [SUM, AVG, MEDIAN, MIN, MAX], [[SUM, AVG, MEDIAN, MIN, MAX], [SUM, AVG], [SUM]]);

    // when
    const picked = picker.pick([spec], requestOf(), 4);

    // then
    expect(picked.context.aggregations).toEqual([SUM, AVG]);
    expect(picked.size).toBe(TileSize.SMALL);
    expect(picked.score).toBeCloseTo(220 / 240 * 170 / 176, 10);
  });

  it('#pick should not choose aggregation set wider than two cells', () => {

    // given
    estimateOf('N1', 500, 170, [80, 80, 80, 80, 80]);
    const spec = specOf('N1', [SUM, AVG, MEDIAN, MIN, MAX], [[SUM, AVG, MEDIAN, MIN, MAX], [SUM]]);

    // when
    const picked = picker.pick([spec], requestOf(), 4);

    // then
    expect(picked.context.aggregations).toEqual([SUM]);
    expect(picked.size).toBe(TileSize.SMALL);
  });

  it('#pick should fall back to fewest aggregations of first candidate wide when no option fits two cells', () => {

    // given
    estimateOf('N1', 1400, 100, [300, 300, 300]);
    estimateOf('N2', 700, 100);
    const first = specOf('N1', [SUM, AVG, MIN], [[SUM, AVG], [SUM], [MIN]]);

    // when
    const picked = picker.pick([first, specOf('N2')], requestOf(), 4);

    // then
    expect(picked.spec).toBe(first);
    expect(picked.context.aggregations).toEqual([SUM]);
    expect(picked.size).toBe(TileSize.WIDE);
    expect(picked.score).toBe(0);
  });

  it('#pick should take fewest aggregations of first candidate wide without estimating when container width is unknown', () => {

    // given
    const first = specOf('N1', [SUM, AVG, MIN], [[SUM, AVG], [MIN], [SUM]]);

    // when
    const picked = picker.pick([first, specOf('N2')], requestOf(0), 4);

    // then
    expect(estimator.estimate).not.toHaveBeenCalled();
    expect(picked.spec).toBe(first);
    expect(picked.context.aggregations).toEqual([MIN]);
    expect(picked.size).toBe(TileSize.WIDE);
    expect(picked.score).toBe(0);
  });

  it('#pick should keep earlier option on equal score', () => {

    // given
    estimateOf('N1', 200, 100, [50, 50]);
    estimateOf('N2', 200, 100, [50, 50]);
    const first = specOf('N1', [SUM, AVG], [[AVG], [SUM]]);

    // when
    const picked = picker.pick([first, specOf('N2', [SUM, AVG], [[SUM], [AVG]])], requestOf(), 4);

    // then
    expect(picked.spec).toBe(first);
    expect(picked.context.aggregations).toEqual([AVG]);
  });

  it('#pick should measure tiles of chosen grid columns and square cells', () => {

    // given
    estimateOf('N1', 240, 176);
    estimateOf('N2', 490, 176);

    // when
    const small = picker.pick([specOf('N1')], requestOf(), 4);
    const wide = picker.pick([specOf('N2')], requestOf(), 4);

    // then
    expect([small.size, small.score]).toEqual([TileSize.SMALL, 1]);
    expect([wide.size, wide.score]).toEqual([TileSize.WIDE, 1]);
  });

  it('#fillOf should return ratio of smaller to larger extent', () => {

    // when
    const fills = [[50, 100], [200, 100], [100, 100]].map(([content, available]) => SummaryTablePicker.fillOf(content, available));

    // then
    expect(fills).toEqual([0.5, 0.5, 1]);
  });
});
