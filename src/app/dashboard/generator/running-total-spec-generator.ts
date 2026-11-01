import { Aggregation } from 'app/shared/model';
import { ChartType } from 'app/shared/model/chart';
import { CategoryCombinationCounter } from './category-combination-counter';
import { ColumnProfile } from './column-profile';
import { SummarySpecGenerator } from './summary-spec-generator';
import { TileSize, TileSpec } from './tile-spec';
import { axisCategoriesOf, MAX_SERIES, tileSpecOf, timeRowsOf } from './tile-spec-builder';
import { TimeSeriesInspector } from './time-series-inspector';

/**
 * a measure charted as running total by the native time unit of the times
 */
export interface RunningTotal {
  measure: ColumnProfile;
  times: ColumnProfile[];
}

/**
 * creates the candidate specs summarizing running totals by their latest values, the maximum of each series
 */
export class RunningTotalSpecGenerator {

  private static readonly MAX_SERIES_CATEGORIES = 2;
  /** the first set holds the aggregations of all others */
  static readonly PERIOD_AGGREGATION_SETS: readonly Aggregation[][] = [[Aggregation.MIN, Aggregation.MAX], [Aggregation.MAX]];

  constructor(private readonly summarySpecGenerator: SummarySpecGenerator) { }

  /**
   * @returns the tables and bar charts of the running totals whose series are identified by up to two categories
   */
  generate(runningTotals: RunningTotal[], categories: ColumnProfile[], combinations: CategoryCombinationCounter,
    inspector: TimeSeriesInspector): TileSpec[] {
    return runningTotals.flatMap(({ measure, times }) => {
      const series = inspector.seriesKeyCategoriesOf(measure, categories);
      if (!series || series.length > RunningTotalSpecGenerator.MAX_SERIES_CATEGORIES) {
        return [];
      }
      const bars = series.every(c => inspector.isComplete(c)) ? this.latestValueBars(measure, series) : [];
      return [...this.latestValueTables(measure, series, times, combinations), ...bars];
    });
  }

  private latestValueTables(measure: ColumnProfile, series: ColumnProfile[], times: ColumnProfile[],
    combinations: CategoryCombinationCounter): TileSpec[] {
    const groupings = this.seriesGroupingsOf(series, combinations);
    const seriesTables = groupings.map(groupByColumns => tileSpecOf({
      dataColumns: [measure],
      groupByColumns,
      aggregations: [Aggregation.MAX],
      size: TileSize.WIDE
    }));
    const periodGroupings = series.length ? groupings : [[]];
    const maxRows = series.length ? SummarySpecGenerator.MAX_HIERARCHY_ROWS : SummarySpecGenerator.MAX_TIME_BUCKETS;
    const periodTables = periodGroupings.flatMap(grouping => times
      .filter(t => this.rowsOf(grouping, combinations) * timeRowsOf(t) <= maxRows)
      .map(t => tileSpecOf({
        dataColumns: [measure],
        groupByColumns: [...grouping, t],
        aggregations: [...RunningTotalSpecGenerator.PERIOD_AGGREGATION_SETS[0]],
        aggregationChoices: RunningTotalSpecGenerator.PERIOD_AGGREGATION_SETS.map(s => [...s]),
        size: TileSize.WIDE
      })));
    return [...seriesTables, ...periodTables];
  }

  /**
   * @returns the groupings by all series categories that fit a table, the category of lower cardinality first
   */
  private seriesGroupingsOf(series: ColumnProfile[], combinations: CategoryCombinationCounter): ColumnProfile[][] {
    if (series.length === 1) {
      return this.rowsOf(series, combinations) <= SummarySpecGenerator.MAX_TABLE_ROWS ? [series] : [];
    }
    return this.summarySpecGenerator.tableCategoryPairs(series, combinations);
  }

  /**
   * @returns the value combinations of the categories, missing values counted as values
   */
  private rowsOf(categories: ColumnProfile[], combinations: CategoryCombinationCounter): number {
    if (!categories.length) {
      return 1;
    }
    return combinations.count(categories[0].name, categories[categories.length - 1].name);
  }

  /**
   * @returns the linear bars of the latest values by each text axis category, stacked by the other series category
   */
  private latestValueBars(measure: ColumnProfile, series: ColumnProfile[]): TileSpec[] {
    return axisCategoriesOf(series)
      .map(axis => ({ axis, splitColumns: series.filter(c => c !== axis) }))
      .filter(({ splitColumns }) => splitColumns.every(s => s.distinctCount <= MAX_SERIES))
      .flatMap(({ axis, splitColumns }) => [ChartType.LINEAR_BAR, ChartType.LINEAR_HORIZONTAL_BAR].map(chartType => tileSpecOf({
        chartType,
        dataColumns: [measure],
        groupByColumns: [axis],
        splitColumns,
        aggregations: [Aggregation.MAX],
        stacked: splitColumns.length > 0,
        showLegend: splitColumns.length > 0,
        size: TileSize.SMALL
      })));
  }
}
