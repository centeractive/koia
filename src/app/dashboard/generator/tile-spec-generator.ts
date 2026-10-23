import { Aggregation, DataType } from 'app/shared/model';
import { ChartType } from 'app/shared/model/chart';
import { ChartDataService } from 'app/shared/services/chart/chart-data.service';
import { CategoryCombinationCounter } from './category-combination-counter';
import { ColumnProfile, ColumnRole } from './column-profile';
import { Randomizer } from './randomizer';
import { SummarySpecGenerator } from './summary-spec-generator';
import { TileSize, TileSpec } from './tile-spec';
import { pairsOf, tileSpecOf } from './tile-spec-builder';

/**
 * creates the candidate tile specs of all recipes that apply to the profiled columns
 */
export class TileSpecGenerator {

  static readonly MAX_SERIES = 6;
  static readonly MAX_AXIS_CATEGORIES = 12;
  /** number of colors of the smallest color schemes, so that the colors of time series never repeat */
  static readonly MAX_TIME_SERIES = 8;
  static readonly MAX_TIME_BARS = 60;

  private static readonly MAX_CIRCULAR_CATEGORIES = 8;
  private static readonly MIN_RADAR_CATEGORIES = 3;
  private static readonly MAX_RADAR_CATEGORIES = 12;
  private static readonly MAX_BAR_CATEGORIES = 20;
  private static readonly MAX_HORIZONTAL_BAR_CATEGORIES = 30;
  private static readonly TIME_CHART_TYPES = [ChartType.LINE, ChartType.AREA];
  private static readonly TIME_AGGREGATIONS = [Aggregation.SUM, Aggregation.AVG];

  constructor(private readonly summarySpecGenerator = new SummarySpecGenerator()) { }

  generate(profiles: ColumnProfile[], randomizer: Randomizer, combinations: CategoryCombinationCounter): TileSpec[] {
    const categories = this.profilesOf(profiles, ColumnRole.CATEGORY);
    const measures = this.profilesOf(profiles, ColumnRole.MEASURE);
    const times = this.profilesOf(profiles, ColumnRole.TIME);
    return [
      ...this.distributions(categories, randomizer),
      ...this.categoriesByCategory(categories, randomizer, combinations),
      ...this.countsOverTime(categories, times, randomizer),
      ...this.valuesOverTime(measures, times, categories),
      ...this.aggregatedValuesOverTime(measures, times, categories, randomizer),
      ...this.rowCountsOverTime(times),
      ...this.scatters(measures, times, categories),
      ...this.valuesByName(measures, categories),
      ...this.summarySpecGenerator.generate(categories, measures, times, randomizer, combinations)
    ].filter(s => !this.isSelfCombination(s));
  }

  /**
   * @returns the group-by columns of a relationship graph, the first category pair of the summary tables, else the first category
   */
  graphGroupings(profiles: ColumnProfile[], combinations: CategoryCombinationCounter): ColumnProfile[] {
    const categories = this.profilesOf(profiles, ColumnRole.CATEGORY);
    return this.summarySpecGenerator.tableCategoryPairs(categories, combinations)[0] ?? categories.slice(0, 1);
  }

  private profilesOf(profiles: ColumnProfile[], role: ColumnRole): ColumnProfile[] {
    return profiles.filter(p => p.role === role);
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
      return tileSpecOf({
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

  private categoriesByCategory(categories: ColumnProfile[], randomizer: Randomizer, combinations: CategoryCombinationCounter):
    TileSpec[] {
    const axisCategories = categories.filter(b => b.dataType === DataType.TEXT && b.distinctCount <= TileSpecGenerator.MAX_AXIS_CATEGORIES);
    return this.seriesCategories(categories).flatMap(a => axisCategories
      .filter(b => b !== a)
      .flatMap(b => this.valueCountSplits(a, b, categories, combinations).flatMap(splitColumns =>
        [ChartType.LINEAR_BAR, ChartType.LINEAR_HORIZONTAL_BAR].map(chartType => tileSpecOf({
          chartType,
          dataColumns: [a],
          groupByColumns: [b],
          splitColumns,
          aggregations: [Aggregation.COUNT],
          stacked: randomizer.chance(),
          showLegend: true,
          size: TileSize.SMALL
        })))));
  }

  /**
   * @returns the split columns of the value count charts of the series category by the axis category, unsplit and split by each
   * other category whose value combinations with the series category fit the series limit
   */
  private valueCountSplits(series: ColumnProfile, axis: ColumnProfile, categories: ColumnProfile[],
    combinations: CategoryCombinationCounter): ColumnProfile[][] {
    return this.unsplitAndSplitBy(categories
      .filter(c => c !== series && c !== axis && combinations.count(series.name, c.name) <= TileSpecGenerator.MAX_SERIES));
  }

  private unsplitAndSplitBy(categories: ColumnProfile[]): ColumnProfile[][] {
    return [[], ...categories.map(c => [c])];
  }

  private countsOverTime(categories: ColumnProfile[], times: ColumnProfile[], randomizer: Randomizer): TileSpec[] {
    return this.seriesCategories(categories).flatMap(a => times
      .flatMap(t => TileSpecGenerator.TIME_CHART_TYPES.map(chartType => tileSpecOf({
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
        ...measures.flatMap(n => this.seriesSplits(categories).flatMap(split => this.timeCharts([n], t, split, t.presentCount))),
        ...pairsOf(measures).flatMap(pair => this.timeCharts(pair, t, [], t.presentCount))
      ]);
  }

  private aggregatedValuesOverTime(measures: ColumnProfile[], times: ColumnProfile[], categories: ColumnProfile[],
    randomizer: Randomizer): TileSpec[] {
    const splits = this.unsplitAndSplitBy(categories.filter(c => c.distinctCount <= TileSpecGenerator.MAX_TIME_SERIES));
    return this.aggregatingTimes(times).flatMap(t => measures.flatMap(n => splits.flatMap(split =>
      this.timeCharts([n], t, split, t.timeBucketCount, [randomizer.pick(TileSpecGenerator.TIME_AGGREGATIONS)]))));
  }

  private rowCountsOverTime(times: ColumnProfile[]): TileSpec[] {
    return this.aggregatingTimes(times).flatMap(t => this.timeCharts([], t, [], t.timeBucketCount, [Aggregation.ROW_COUNT]));
  }

  /**
   * @returns the times whose time buckets aggregate values and fit a chart
   */
  private aggregatingTimes(times: ColumnProfile[]): ColumnProfile[] {
    return times.filter(t => t.timeBucketCount < t.presentCount && t.timeBucketCount <= ChartDataService.MAX_DATA_POINTS);
  }

  /**
   * @returns line and area charts, and linear bar charts when their bars per series fit the bar limit
   */
  private timeCharts(dataColumns: ColumnProfile[], time: ColumnProfile, splitColumns: ColumnProfile[], points: number,
    aggregations: Aggregation[] = []): TileSpec[] {
    const chartTypes = points <= TileSpecGenerator.MAX_TIME_BARS ?
      [...TileSpecGenerator.TIME_CHART_TYPES, ChartType.LINEAR_BAR] : TileSpecGenerator.TIME_CHART_TYPES;
    return chartTypes.map(chartType => tileSpecOf({
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
      .flatMap(x => this.scatterSplits(n, categories).map(split => tileSpecOf({
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
    return this.unsplitAndSplitBy(this.seriesCategories(categories));
  }

  /**
   * @returns the split columns of all scatter specs of the specified measure whose series fit, else the unsplit scatter that is
   * sampled down
   */
  private scatterSplits(measure: ColumnProfile, categories: ColumnProfile[]): ColumnProfile[][] {
    const variants: ColumnProfile[][] = measure.presentCount <= ChartDataService.MAX_DATA_POINTS ? [[]] : [];
    this.seriesCategories(categories)
      .filter(s => Math.min(measure.presentCount, s.maxValueCount) <= ChartDataService.MAX_DATA_POINTS)
      .forEach(s => variants.push([s]));
    return variants.length ? variants : [[]];
  }

  /**
   * @returns the radar and bar charts of the individual values of each measure labeled by a text category of unique values
   */
  private valuesByName(measures: ColumnProfile[], categories: ColumnProfile[]): TileSpec[] {
    return categories
      .filter(c => c.dataType === DataType.TEXT && c.maxValueCount === 1)
      .flatMap(c => measures.flatMap(n => this.nameChartTypes(c.distinctCount).map(chartType => tileSpecOf({
        chartType,
        dataColumns: [n],
        groupByColumns: [c],
        aggregations: [],
        size: TileSize.SMALL
      }))));
  }

  private nameChartTypes(distinctCount: number): ChartType[] {
    return this.distributionChartTypes(distinctCount).filter(t => [ChartType.BAR, ChartType.HORIZONTAL_BAR, ChartType.RADAR].includes(t));
  }

  private seriesCategories(categories: ColumnProfile[]): ColumnProfile[] {
    return categories.filter(c => c.distinctCount <= TileSpecGenerator.MAX_SERIES);
  }
}
