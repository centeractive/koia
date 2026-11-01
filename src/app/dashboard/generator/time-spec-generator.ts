import { Aggregation } from 'app/shared/model';
import { ChartType } from 'app/shared/model/chart';
import { ChartDataService } from 'app/shared/services/chart/chart-data.service';
import { ColumnProfile } from './column-profile';
import { Randomizer } from './randomizer';
import { TileSize, TileSpec } from './tile-spec';
import { pairsOf, seriesCategoriesOf, tileSpecOf, unsplitAndSplitBy } from './tile-spec-builder';
import { TimeSeriesInspector } from './time-series-inspector';

type AggregationsOf = (measure: ColumnProfile) => Aggregation[];

/**
 * creates the candidate time chart specs, running totals aggregated per native time unit
 */
export class TimeSpecGenerator {

  /** number of colors of the smallest color schemes, so that the colors of time series never repeat */
  static readonly MAX_TIME_SERIES = 8;
  static readonly MAX_TIME_BARS = 60;

  private static readonly TIME_CHART_TYPES = [ChartType.LINE, ChartType.AREA];
  private static readonly TIME_AGGREGATIONS = [Aggregation.SUM, Aggregation.AVG];

  generate(categories: ColumnProfile[], measures: ColumnProfile[], times: ColumnProfile[], randomizer: Randomizer,
    inspector: TimeSeriesInspector): TileSpec[] {
    return [
      ...this.countsOverTime(categories, times, randomizer, inspector),
      ...this.valuesOverTime(measures, times, categories),
      ...this.runningTotalsOverTime(measures, times, categories, inspector),
      ...this.aggregatedValuesOverTime(measures, times, categories, inspector),
      ...this.rowCountsOverTime(times, inspector)
    ];
  }

  /**
   * @returns the times by whose native time unit the measure is charted as running total
   */
  runningTotalTimes(measure: ColumnProfile, times: ColumnProfile[], inspector: TimeSeriesInspector): ColumnProfile[] {
    return this.nativeAggregatingTimes(times).filter(t => inspector.isRunningTotal(measure, t));
  }

  private countsOverTime(categories: ColumnProfile[], times: ColumnProfile[], randomizer: Randomizer, inspector: TimeSeriesInspector):
    TileSpec[] {
    return seriesCategoriesOf(categories).flatMap(a => times
      .filter(t => !inspector.isUniform(t, a))
      .flatMap(t => TimeSpecGenerator.TIME_CHART_TYPES.map(chartType => tileSpecOf({
        chartType,
        dataColumns: [a],
        groupByColumns: [t],
        aggregations: [Aggregation.COUNT],
        stacked: chartType === ChartType.AREA || randomizer.chance(),
        showLegend: true,
        size: TileSize.WIDE,
        timeChart: true
      }))));
  }

  private valuesOverTime(measures: ColumnProfile[], times: ColumnProfile[], categories: ColumnProfile[]): TileSpec[] {
    return times
      .filter(t => t.maxValueCount === 1)
      .flatMap(t => [
        ...measures.flatMap(n => unsplitAndSplitBy(seriesCategoriesOf(categories)).flatMap(split =>
          this.timeCharts([n], t, split, t.presentCount))),
        ...pairsOf(measures).flatMap(pair => this.timeCharts(pair, t, [], t.presentCount))
      ]);
  }

  private runningTotalsOverTime(measures: ColumnProfile[], times: ColumnProfile[], categories: ColumnProfile[],
    inspector: TimeSeriesInspector): TileSpec[] {
    return this.nativeAggregatingTimes(times).flatMap(t => this.aggregatedCharts(measures.filter(n => inspector.isRunningTotal(n, t)),
      { ...t, groupingTimeUnit: t.nativeTimeUnit, timeBucketCount: t.nativeBucketCount }, categories,
      () => TimeSpecGenerator.TIME_AGGREGATIONS));
  }

  /**
   * @returns the charts of the measures not charted as running totals of the time, running totals averaged only
   */
  private aggregatedValuesOverTime(measures: ColumnProfile[], times: ColumnProfile[], categories: ColumnProfile[],
    inspector: TimeSeriesInspector): TileSpec[] {
    return this.aggregatingTimes(times).flatMap(t => {
      const nativelyCharted = this.nativeAggregatingTimes([t]).length > 0;
      const aggregationsOf: AggregationsOf = n => inspector.isRunningTotal(n, t) ? [Aggregation.AVG] : TimeSpecGenerator.TIME_AGGREGATIONS;
      return this.aggregatedCharts(measures.filter(n => !nativelyCharted || !inspector.isRunningTotal(n, t)), t, categories,
        aggregationsOf);
    });
  }

  /**
   * @returns the charts of each measure unsplit and split by each category within the time series limit, and of each measure pair
   * with distinct value axes, each of every aggregation of its measures
   */
  private aggregatedCharts(measures: ColumnProfile[], time: ColumnProfile, categories: ColumnProfile[], aggregationsOf: AggregationsOf):
    TileSpec[] {
    const splits = unsplitAndSplitBy(categories.filter(c => c.distinctCount <= TimeSpecGenerator.MAX_TIME_SERIES));
    return [
      ...measures.flatMap(n => splits.flatMap(split => aggregationsOf(n).flatMap(aggregation =>
        this.timeCharts([n], time, split, time.timeBucketCount, [aggregation])))),
      ...pairsOf(measures).flatMap(pair => aggregationsOf(pair[0]).filter(a => aggregationsOf(pair[1]).includes(a)).flatMap(aggregation =>
        this.timeCharts(pair, time, [], time.timeBucketCount, [aggregation])))
    ];
  }

  private rowCountsOverTime(times: ColumnProfile[], inspector: TimeSeriesInspector): TileSpec[] {
    return this.aggregatingTimes(times)
      .filter(t => !inspector.isUniform(t))
      .flatMap(t => this.timeCharts([], t, [], t.timeBucketCount, [Aggregation.ROW_COUNT]));
  }

  /**
   * @returns the times whose time buckets aggregate values and fit a chart
   */
  private aggregatingTimes(times: ColumnProfile[]): ColumnProfile[] {
    return times.filter(t => t.timeBucketCount < t.presentCount && t.timeBucketCount <= ChartDataService.MAX_DATA_POINTS);
  }

  /**
   * @returns the times whose native time units aggregate values and fit a chart
   */
  private nativeAggregatingTimes(times: ColumnProfile[]): ColumnProfile[] {
    return times.filter(t => t.nativeBucketCount < t.presentCount && t.nativeBucketCount <= ChartDataService.MAX_DATA_POINTS);
  }

  /**
   * @returns line charts, area charts of a single series or stacked split sums, and linear bar charts when their bars per series fit
   * the bar limit
   */
  private timeCharts(dataColumns: ColumnProfile[], time: ColumnProfile, splitColumns: ColumnProfile[], points: number,
    aggregations: Aggregation[] = []): TileSpec[] {
    const split = splitColumns.length > 0;
    const area = split ? aggregations.length === 1 && aggregations[0] === Aggregation.SUM : dataColumns.length <= 1;
    const chartTypes = [ChartType.LINE, ...(area ? [ChartType.AREA] : []),
      ...(points <= TimeSpecGenerator.MAX_TIME_BARS ? [ChartType.LINEAR_BAR] : [])];
    return chartTypes.map(chartType => tileSpecOf({
      chartType,
      dataColumns,
      groupByColumns: [time],
      splitColumns,
      aggregations,
      stacked: split && chartType === ChartType.AREA,
      multiValueAxes: dataColumns.length > 1,
      showLegend: splitColumns.length > 0 || dataColumns.length > 1,
      size: TileSize.WIDE,
      timeChart: true
    }));
  }
}
