import { Aggregation, DataType } from 'app/shared/model';
import { ChartType } from 'app/shared/model/chart';
import { ChartDataService } from 'app/shared/services/chart/chart-data.service';
import { CategoryCombinationCounter } from './category-combination-counter';
import { ColumnProfile, ColumnRole } from './column-profile';
import { Randomizer } from './randomizer';
import { RunningTotal, RunningTotalSpecGenerator } from './running-total-spec-generator';
import { SummarySpecGenerator } from './summary-spec-generator';
import { TileSize, TileSpec } from './tile-spec';
import { axisCategoriesOf, isUniformCategory, MAX_SERIES, seriesCategoriesOf, tileSpecOf, unsplitAndSplitBy } from './tile-spec-builder';
import { TimeSeriesInspector } from './time-series-inspector';
import { TimeSpecGenerator } from './time-spec-generator';

/**
 * creates the candidate tile specs of all recipes that apply to the profiled columns
 */
export class TileSpecGenerator {

  static readonly MAX_SERIES = MAX_SERIES;

  private static readonly MAX_CIRCULAR_CATEGORIES = 8;
  private static readonly MIN_RADAR_CATEGORIES = 3;
  private static readonly MAX_RADAR_CATEGORIES = 12;
  private static readonly MIN_BAR_CATEGORIES = 3;
  private static readonly MAX_BAR_CATEGORIES = 20;
  private static readonly MAX_HORIZONTAL_BAR_CATEGORIES = 30;

  constructor(private readonly summarySpecGenerator = new SummarySpecGenerator(),
    private readonly timeSpecGenerator = new TimeSpecGenerator(),
    private readonly runningTotalSpecGenerator = new RunningTotalSpecGenerator(summarySpecGenerator)) { }

  /**
   * @returns the specs of all recipes, the running totals charted per native time unit summarized by their latest values only
   */
  generate(profiles: ColumnProfile[], randomizer: Randomizer, combinations: CategoryCombinationCounter, inspector: TimeSeriesInspector):
    TileSpec[] {
    const categories = this.profilesOf(profiles, ColumnRole.CATEGORY);
    const measures = this.profilesOf(profiles, ColumnRole.MEASURE);
    const times = this.profilesOf(profiles, ColumnRole.TIME);
    const runningTotals: RunningTotal[] = measures
      .map(measure => ({ measure, times: this.timeSpecGenerator.runningTotalTimes(measure, times, inspector) }))
      .filter(r => r.times.length > 0);
    const summaryMeasures = measures.filter(n => !runningTotals.some(r => r.measure === n));
    return [
      ...this.distributions(categories, randomizer),
      ...this.categoriesByCategory(categories, randomizer, combinations),
      ...this.timeSpecGenerator.generate(categories, measures, times, randomizer, inspector),
      ...this.scatters(measures, times, categories, runningTotals),
      ...this.valuesByName(measures, categories),
      ...this.summarySpecGenerator.generate(categories, summaryMeasures, times, combinations, inspector),
      ...this.runningTotalSpecGenerator.generate(runningTotals, categories, combinations, inspector)
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
    return categories
      .filter(c => !isUniformCategory(c))
      .flatMap(c => this.distributionChartTypes(c.distinctCount).map(chartType => {
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
    if (distinctCount < TileSpecGenerator.MIN_BAR_CATEGORIES) {
      return chartTypes;
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
    const axisCategories = axisCategoriesOf(categories);
    return seriesCategoriesOf(categories).flatMap(a => axisCategories
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
    return unsplitAndSplitBy(categories
      .filter(c => c !== series && c !== axis && combinations.count(series.name, c.name) <= MAX_SERIES));
  }

  /**
   * @returns the scatters of each measure by each other measure and by each time but the times of its running total
   */
  private scatters(measures: ColumnProfile[], times: ColumnProfile[], categories: ColumnProfile[], runningTotals: RunningTotal[]):
    TileSpec[] {
    const runningTotalTimesOf = (n: ColumnProfile) => runningTotals.find(r => r.measure === n)?.times ?? [];
    return measures.flatMap(n => [...times.filter(t => !runningTotalTimesOf(n).includes(t)), ...measures.filter(x => x !== n)]
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

  /**
   * @returns the split columns of all scatter specs of the specified measure whose series fit, else the unsplit scatter that is
   * sampled down
   */
  private scatterSplits(measure: ColumnProfile, categories: ColumnProfile[]): ColumnProfile[][] {
    const variants: ColumnProfile[][] = measure.presentCount <= ChartDataService.MAX_DATA_POINTS ? [[]] : [];
    seriesCategoriesOf(categories)
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
}
