import { Aggregation, Column, DataType, ElementContext, SummaryContext } from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { SequenceRandomSource } from 'app/shared/test';
import { ColumnProfile, ColumnRole } from './column-profile';
import { Randomizer } from './randomizer';
import { TileSignature } from './tile-signature';
import { TileSize, TileSpec } from './tile-spec';
import { TileSpecRanker } from './tile-spec-ranker';

describe('TileSpecRanker', () => {

  const LEVEL: Column = { name: 'Level', dataType: DataType.TEXT, width: 10 };
  const REGION: Column = { name: 'Region', dataType: DataType.TEXT, width: 10 };

  let ranker: TileSpecRanker;
  let randomizer: Randomizer;
  let currentContexts: ElementContext[];
  let samePieKey: TileSpec;
  let otherChartType: TileSpec;
  let sameTableKey: TileSpec;
  let unusedChart: TileSpec;
  let unusedColumnSet: TileSpec;

  beforeEach(() => {
    ranker = new TileSpecRanker();
    randomizer = new Randomizer(new SequenceRandomSource([0.3, 0.8, 0.1]));
    const pie = new ChartContext([LEVEL, REGION], ChartType.PIE.type, { top: 0, right: 0, bottom: 0, left: 0 });
    pie.dataColumns = [LEVEL];
    const summary = new SummaryContext([LEVEL, REGION]);
    summary.dataColumns = [LEVEL];
    summary.groupByColumns = [REGION];
    summary.aggregations = [Aggregation.SUM];
    currentContexts = [pie, summary];
    samePieKey = spec(ChartType.PIE, ['Level']);
    otherChartType = spec(ChartType.BAR, ['Level']);
    sameTableKey = spec(undefined, ['Level', 'Region']);
    unusedChart = spec(ChartType.PIE, ['Region']);
    unusedColumnSet = spec(ChartType.LINEAR_BAR, ['Level', 'Region']);
  });

  function profile(name: string): ColumnProfile {
    return { name, dataType: DataType.TEXT, role: ColumnRole.CATEGORY, distinctCount: 3, presentCount: 10, maxValueCount: 5 };
  }

  function spec(chartType: ChartType, columnNames: string[]): TileSpec {
    const signature = TileSignature.of(chartType ? 'chart' : 'table', columnNames);
    const [data, ...groupBy] = columnNames.map(n => profile(n));
    return {
      signature, key: TileSignature.keyOf(signature, chartType?.type), chartType, dataColumns: [data], groupByColumns: groupBy,
      splitColumns: [], aggregations: [], stacked: false, multiValueAxes: false, showLegend: false, legendPosition: 'top',
      size: TileSize.SMALL, timeChart: false
    };
  }

  function allSpecs(): TileSpec[] {
    return [samePieKey, otherChartType, sameTableKey, unusedChart, unusedColumnSet];
  }

  it('#rank should keep all specs', () => {

    // when
    const ranked = ranker.rank(allSpecs(), currentContexts, randomizer);

    // then
    expect(ranked.length).toBe(5);
    expect(new Set(ranked)).toEqual(new Set(allSpecs()));
  });

  it('#rank should order specs with unused signatures before reused ones', () => {

    // when
    const ranked = ranker.rank(allSpecs(), currentContexts, randomizer);

    // then
    expect(new Set(ranked.slice(0, 2))).toEqual(new Set([unusedChart, unusedColumnSet]));
  });

  it('#rank should order reused signature with other chart type before identical key', () => {

    // when
    const ranked = ranker.rank(allSpecs(), currentContexts, randomizer);

    // then
    expect(ranked[2]).toBe(otherChartType);
    expect(new Set(ranked.slice(3))).toEqual(new Set([samePieKey, sameTableKey]));
  });
});
