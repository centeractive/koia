import { Aggregation, DataType } from 'app/shared/model';
import { ChartType } from 'app/shared/model/chart';
import { ChartDataService } from 'app/shared/services/chart/chart-data.service';
import { CategoryCombinationCounter } from './category-combination-counter';
import { ColumnProfile, ColumnRole } from './column-profile';
import { Randomizer } from './randomizer';
import { TileSignature } from './tile-signature';
import { TileSize, TileSpec } from './tile-spec';

type SpecFields = Pick<TileSpec, 'dataColumns' | 'aggregations' | 'size'> & Partial<Omit<TileSpec, 'signature' | 'key'>>;

/**
 * creates the candidate tile specs of all recipes that apply to the profiled columns
 */
export class TileSpecGenerator {

  static readonly MAX_SERIES = 6;
  static readonly MAX_AXIS_CATEGORIES = 12;
  static readonly MAX_TABLE_ROWS = 24;
  static readonly MAX_HIERARCHY_ROWS = 60;
  static readonly MAX_TIME_BUCKETS = 36;
  static readonly MAX_RANGE_CATEGORIES = 8;
  /** number of colors of the smallest color schemes, so that the colors of time series never repeat */
  static readonly MAX_TIME_SERIES = 8;
  static readonly AGGREGATION_SETS: readonly Aggregation[][] = [
    [Aggregation.MIN, Aggregation.MAX, Aggregation.AVG, Aggregation.SUM],
    [Aggregation.SUM, Aggregation.AVG],
    [Aggregation.AVG, Aggregation.MEDIAN, Aggregation.MAX],
    [Aggregation.SUM]
  ];

  private static readonly MAX_CIRCULAR_CATEGORIES = 8;
  private static readonly MIN_RADAR_CATEGORIES = 3;
  private static readonly MAX_RADAR_CATEGORIES = 12;
  private static readonly MAX_BAR_CATEGORIES = 20;
  private static readonly MAX_HORIZONTAL_BAR_CATEGORIES = 30;
  private static readonly TIME_CHART_TYPES = [ChartType.LINE, ChartType.AREA];
  private static readonly TIME_AGGREGATIONS = [Aggregation.SUM, Aggregation.AVG];

  generate(profiles: ColumnProfile[], randomizer: Randomizer, combinations: CategoryCombinationCounter): TileSpec[] {
    const categories = profiles.filter(p => p.role === ColumnRole.CATEGORY);
    const measures = profiles.filter(p => p.role === ColumnRole.MEASURE);
    const times = profiles.filter(p => p.role === ColumnRole.TIME);
    return [
      ...this.distributions(categories, randomizer),
      ...this.categoriesByCategory(categories, randomizer),
      ...this.countsOverTime(categories, times, randomizer),
      ...this.valuesOverTime(measures, times, categories),
      ...this.aggregatedValuesOverTime(measures, times, categories, randomizer),
      ...this.rowCountsOverTime(times),
      ...this.scatters(measures, times, categories),
      ...this.measuresByCategories(measures, categories, randomizer, combinations),
      ...this.measuresOverTime(measures, times, randomizer),
      ...this.categoryCrosstabs(categories, combinations),
      ...this.valueRanges(measures, categories)
    ].filter(s => !this.isSelfCombination(s));
  }

  /**
   * a number column is profiled as measure and as ordinal category, it must not be combined with itself
   */
  private isSelfCombination(spec: TileSpec): boolean {
    const names = [...spec.dataColumns, ...spec.groupByColumns, ...spec.splitColumns].map(c => c.name);
    return new Set(names).size < names.length;
  }

  private distributions(categories: ColumnProfile[], randomizer: Randomizer): TileSpec[] {
    return categories.flatMap(c => this.distributionChartTypes(c.distinctCount).map(chartType => {
      const legend = [ChartType.PIE, ChartType.DOUGHNUT, ChartType.POLAR_AREA].includes(chartType);
      return this.spec({
        chartType,
        dataColumns: [c],
        aggregations: [Aggregation.COUNT],
        showLegend: legend,
        legendPosition: legend ? randomizer.pick(['top', 'right']) : 'top',
        size: TileSize.SMALL
      });
    }));
  }

  private distributionChartTypes(distinctCount: number): ChartType[] {
    const chartTypes: ChartType[] = [];
    if (distinctCount <= TileSpecGenerator.MAX_CIRCULAR_CATEGORIES) {
      chartTypes.push(ChartType.PIE, ChartType.DOUGHNUT, ChartType.POLAR_AREA);
    }
    if (distinctCount >= TileSpecGenerator.MIN_RADAR_CATEGORIES && distinctCount <= TileSpecGenerator.MAX_RADAR_CATEGORIES) {
      chartTypes.push(ChartType.RADAR);
    }
    if (distinctCount <= TileSpecGenerator.MAX_BAR_CATEGORIES) {
      chartTypes.push(ChartType.BAR);
    }
    if (distinctCount <= TileSpecGenerator.MAX_HORIZONTAL_BAR_CATEGORIES) {
      chartTypes.push(ChartType.HORIZONTAL_BAR);
    }
    return chartTypes;
  }

  private categoriesByCategory(categories: ColumnProfile[], randomizer: Randomizer): TileSpec[] {
    const axisCategories = categories.filter(b => b.dataType === DataType.TEXT && b.distinctCount <= TileSpecGenerator.MAX_AXIS_CATEGORIES);
    return this.seriesCategories(categories).flatMap(a => axisCategories
      .filter(b => b !== a)
      .flatMap(b => [ChartType.LINEAR_BAR, ChartType.LINEAR_HORIZONTAL_BAR].map(chartType => this.spec({
        chartType,
        dataColumns: [a],
        groupByColumns: [b],
        aggregations: [Aggregation.COUNT],
        stacked: randomizer.chance(),
        showLegend: true,
        size: TileSize.SMALL
      }))));
  }

  private countsOverTime(categories: ColumnProfile[], times: ColumnProfile[], randomizer: Randomizer): TileSpec[] {
    return this.seriesCategories(categories).flatMap(a => times
      .flatMap(t => TileSpecGenerator.TIME_CHART_TYPES.map(chartType => this.spec({
        chartType,
        dataColumns: [a],
        groupByColumns: [t],
        aggregations: [Aggregation.COUNT],
        stacked: randomizer.chance(),
        showLegend: true,
        size: TileSize.WIDE,
        timeChart: true
      }))));
  }

  private valuesOverTime(measures: ColumnProfile[], times: ColumnProfile[], categories: ColumnProfile[]): TileSpec[] {
    return times
      .filter(t => t.maxValueCount === 1)
      .flatMap(t => [
        ...measures.flatMap(n => this.seriesSplits(categories).flatMap(split => this.timeCharts([n], t, split))),
        ...this.pairsOf(measures).flatMap(pair => this.timeCharts(pair, t, []))
      ]);
  }

  private aggregatedValuesOverTime(measures: ColumnProfile[], times: ColumnProfile[], categories: ColumnProfile[],
    randomizer: Randomizer): TileSpec[] {
    const splits = [[], ...categories.filter(c => c.distinctCount <= TileSpecGenerator.MAX_TIME_SERIES).map(c => [c])];
    return this.aggregatingTimes(times).flatMap(t => measures.flatMap(n => splits.flatMap(split =>
      this.timeCharts([n], t, split, [randomizer.pick(TileSpecGenerator.TIME_AGGREGATIONS)]))));
  }

  private rowCountsOverTime(times: ColumnProfile[]): TileSpec[] {
    return this.aggregatingTimes(times).flatMap(t => this.timeCharts([], t, [], [Aggregation.ROW_COUNT]));
  }

  /**
   * @returns the times whose time buckets aggregate values and fit a chart
   */
  private aggregatingTimes(times: ColumnProfile[]): ColumnProfile[] {
    return times.filter(t => t.timeBucketCount < t.presentCount && t.timeBucketCount <= ChartDataService.MAX_DATA_POINTS);
  }

  private timeCharts(dataColumns: ColumnProfile[], time: ColumnProfile, splitColumns: ColumnProfile[],
    aggregations: Aggregation[] = []): TileSpec[] {
    return TileSpecGenerator.TIME_CHART_TYPES.map(chartType => this.spec({
      chartType,
      dataColumns,
      groupByColumns: [time],
      splitColumns,
      aggregations,
      multiValueAxes: dataColumns.length > 1,
      showLegend: splitColumns.length > 0 || dataColumns.length > 1,
      size: TileSize.WIDE,
      timeChart: true
    }));
  }

  private scatters(measures: ColumnProfile[], times: ColumnProfile[], categories: ColumnProfile[]): TileSpec[] {
    return measures.flatMap(n => [...times, ...measures.filter(x => x !== n)]
      .flatMap(x => this.scatterSplits(n, categories).map(split => this.spec({
        chartType: ChartType.SCATTER,
        dataColumns: [n],
        groupByColumns: [x],
        splitColumns: split,
        aggregations: [],
        showLegend: split.length > 0,
        size: TileSize.WIDE
      }))));
  }

  private seriesSplits(categories: ColumnProfile[]): ColumnProfile[][] {
    return [[], ...this.seriesCategories(categories).map(c => [c])];
  }

  /**
   * @returns the split columns of all scatter specs of the specified measure whose series fit
   */
  private scatterSplits(measure: ColumnProfile, categories: ColumnProfile[]): ColumnProfile[][] {
    const variants: ColumnProfile[][] = measure.presentCount <= ChartDataService.MAX_DATA_POINTS ? [[]] : [];
    this.seriesCategories(categories)
      .filter(s => Math.min(measure.presentCount, s.maxValueCount) <= ChartDataService.MAX_DATA_POINTS)
      .forEach(s => variants.push([s]));
    return variants;
  }

  private measuresByCategories(measures: ColumnProfile[], categories: ColumnProfile[], randomizer: Randomizer,
    combinations: CategoryCombinationCounter): TileSpec[] {
    const groupings = [
      ...categories.filter(c => c.distinctCount <= TileSpecGenerator.MAX_TABLE_ROWS).map(c => [c]),
      ...this.tableCategoryPairs(categories, combinations)
    ];
    return measures.flatMap(n => groupings.map(groupByColumns => this.spec({
      dataColumns: [n],
      groupByColumns,
      aggregations: [...randomizer.pick(TileSpecGenerator.AGGREGATION_SETS)],
      size: TileSize.WIDE
    })));
  }

  private measuresOverTime(measures: ColumnProfile[], times: ColumnProfile[], randomizer: Randomizer): TileSpec[] {
    return measures.flatMap(n => times
      .filter(t => t.timeBucketCount <= TileSpecGenerator.MAX_TIME_BUCKETS)
      .map(t => this.spec({
        dataColumns: [n],
        groupByColumns: [t],
        aggregations: [...randomizer.pick(TileSpecGenerator.AGGREGATION_SETS)],
        size: TileSize.WIDE
      })));
  }

  private categoryCrosstabs(categories: ColumnProfile[], combinations: CategoryCombinationCounter): TileSpec[] {
    return this.tableCategoryPairs(categories, combinations).map(([c1, c2]) => this.spec({
      dataColumns: [c2],
      groupByColumns: [c1],
      aggregations: [Aggregation.COUNT],
      size: TileSize.WIDE
    }));
  }

  private valueRanges(measures: ColumnProfile[], categories: ColumnProfile[]): TileSpec[] {
    const rangeCategories = categories.filter(c => c.distinctCount <= TileSpecGenerator.MAX_RANGE_CATEGORIES);
    return measures.flatMap(n => rangeCategories.map(c => this.spec({
      dataColumns: [n],
      groupByColumns: [c],
      aggregations: [Aggregation.COUNT],
      valueGroupingColumn: n,
      size: TileSize.WIDE
    })));
  }

  private seriesCategories(categories: ColumnProfile[]): ColumnProfile[] {
    return categories.filter(c => c.distinctCount <= TileSpecGenerator.MAX_SERIES);
  }

  /**
   * @returns the category pairs whose value combinations are within the hierarchy row limit, the category of lower cardinality
   * first
   */
  private tableCategoryPairs(categories: ColumnProfile[], combinations: CategoryCombinationCounter): ColumnProfile[][] {
    return this.pairsOf(categories)
      .filter(([c1, c2]) => combinations.count(c1.name, c2.name) <= TileSpecGenerator.MAX_HIERARCHY_ROWS)
      .map(([c1, c2]) => c2.distinctCount < c1.distinctCount ? [c2, c1] : [c1, c2]);
  }

  private pairsOf(profiles: ColumnProfile[]): ColumnProfile[][] {
    return profiles.flatMap((p1, i) => profiles.slice(i + 1).map(p2 => [p1, p2]));
  }

  private spec(fields: SpecFields): TileSpec {
    const groupByColumns = fields.groupByColumns ?? [];
    const splitColumns = fields.splitColumns ?? [];
    const columnNames = [...fields.dataColumns, ...groupByColumns, ...splitColumns].map(c => c.name);
    const countOnly = fields.aggregations.length === 1 && fields.aggregations[0] === Aggregation.COUNT;
    const signature = TileSignature.of(fields.chartType ? 'chart' : TileSignature.summaryKind(countOnly), columnNames);
    return {
      signature,
      key: TileSignature.keyOf(signature, fields.chartType?.type),
      chartType: fields.chartType,
      dataColumns: fields.dataColumns,
      groupByColumns,
      splitColumns,
      aggregations: fields.aggregations,
      valueGroupingColumn: fields.valueGroupingColumn,
      stacked: fields.stacked ?? false,
      multiValueAxes: fields.multiValueAxes ?? false,
      showLegend: fields.showLegend ?? false,
      legendPosition: fields.legendPosition ?? 'top',
      size: fields.size,
      timeChart: fields.timeChart ?? false
    };
  }
}
