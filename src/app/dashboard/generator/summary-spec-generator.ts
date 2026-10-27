import { Aggregation } from 'app/shared/model';
import { CategoryCombinationCounter } from './category-combination-counter';
import { ColumnProfile } from './column-profile';
import { TileSize, TileSpec } from './tile-spec';
import { pairsOf, tileSpecOf, triplesOf } from './tile-spec-builder';

/**
 * creates the candidate summary table specs of all recipes that apply to the profiled columns
 */
export class SummarySpecGenerator {

  static readonly MAX_TABLE_ROWS = 24;
  static readonly MAX_HIERARCHY_ROWS = 60;
  static readonly MAX_HIERARCHY_TRIPLES = 20;
  static readonly MAX_TIME_BUCKETS = 36;
  static readonly MAX_RANGE_CATEGORIES = 8;
  /** the first set holds the aggregations of all others */
  static readonly AGGREGATION_SETS: readonly Aggregation[][] = [
    [Aggregation.SUM, Aggregation.AVG, Aggregation.MEDIAN, Aggregation.MIN, Aggregation.MAX],
    [Aggregation.MIN, Aggregation.MAX, Aggregation.AVG, Aggregation.SUM],
    [Aggregation.SUM, Aggregation.AVG],
    [Aggregation.AVG, Aggregation.MEDIAN, Aggregation.MAX],
    [Aggregation.SUM]
  ];
  static readonly STATISTICS: readonly Aggregation[] = [Aggregation.MIN, Aggregation.MAX, Aggregation.AVG, Aggregation.MEDIAN];
  static readonly RANGE_AGGREGATIONS: readonly Aggregation[] = [Aggregation.MIN, Aggregation.AVG, Aggregation.MAX];

  generate(categories: ColumnProfile[], measures: ColumnProfile[], times: ColumnProfile[], combinations: CategoryCombinationCounter):
    TileSpec[] {
    return [
      ...this.measuresByCategories(measures, categories, combinations),
      ...this.measuresOverTime(measures, times),
      ...this.measuresOverTimeByCategory(measures, times, categories),
      ...this.categoryCrosstabs(categories, combinations),
      ...this.valueRanges(measures, categories),
      ...this.measureStatistics(measures),
      ...this.valueRangeCounts(measures),
      ...this.measuresByValueRanges(measures),
      ...this.categoryCounts(categories),
      ...this.categoryCountsOverTime(categories, times)
    ];
  }

  /**
   * @returns the category pairs whose value combinations are within the hierarchy row limit, the category of lower cardinality
   * first
   */
  tableCategoryPairs(categories: ColumnProfile[], combinations: CategoryCombinationCounter): ColumnProfile[][] {
    return pairsOf(categories)
      .filter(([c1, c2]) => combinations.count(c1.name, c2.name) <= SummarySpecGenerator.MAX_HIERARCHY_ROWS)
      .map(([c1, c2]) => c2.distinctCount < c1.distinctCount ? [c2, c1] : [c1, c2]);
  }

  /**
   * @returns the first category triples whose rows, estimated by the smallest product of the combinations of a pair and the values
   * of the third category, are within the hierarchy row limit, ordered by ascending cardinality
   */
  tableCategoryTriples(categories: ColumnProfile[], combinations: CategoryCombinationCounter): ColumnProfile[][] {
    return triplesOf(categories)
      .filter(triple => this.estimatedRows(triple, combinations) <= SummarySpecGenerator.MAX_HIERARCHY_ROWS)
      .map(triple => [...triple].sort((c1, c2) => c1.distinctCount - c2.distinctCount))
      .slice(0, SummarySpecGenerator.MAX_HIERARCHY_TRIPLES);
  }

  private estimatedRows([c1, c2, c3]: ColumnProfile[], combinations: CategoryCombinationCounter): number {
    return Math.min(
      combinations.count(c1.name, c2.name) * c3.distinctCount,
      combinations.count(c1.name, c3.name) * c2.distinctCount,
      combinations.count(c2.name, c3.name) * c1.distinctCount
    );
  }

  private measuresByCategories(measures: ColumnProfile[], categories: ColumnProfile[], combinations: CategoryCombinationCounter):
    TileSpec[] {
    const groupings = [
      ...categories.filter(c => c.distinctCount <= SummarySpecGenerator.MAX_TABLE_ROWS).map(c => [c]),
      ...this.tableCategoryPairs(categories, combinations),
      ...this.tableCategoryTriples(categories, combinations)
    ];
    return measures.flatMap(n => groupings.map(groupByColumns => this.measureTable(n, groupByColumns)));
  }

  private measuresOverTime(measures: ColumnProfile[], times: ColumnProfile[]): TileSpec[] {
    return measures.flatMap(n => times
      .filter(t => this.timeRows(t) <= SummarySpecGenerator.MAX_TIME_BUCKETS)
      .map(t => this.measureTable(n, [t])));
  }

  private measuresOverTimeByCategory(measures: ColumnProfile[], times: ColumnProfile[], categories: ColumnProfile[]): TileSpec[] {
    return measures.flatMap(n => categories.flatMap(c => times
      .filter(t => c.distinctCount * this.timeRows(t) <= SummarySpecGenerator.MAX_HIERARCHY_ROWS)
      .map(t => this.measureTable(n, [c, t]))));
  }

  /**
   * @returns the summary table of the measure that shows the aggregation set filling its tile best
   */
  private measureTable(measure: ColumnProfile, groupByColumns: ColumnProfile[]): TileSpec {
    return tileSpecOf({
      dataColumns: [measure],
      groupByColumns,
      aggregations: [...SummarySpecGenerator.AGGREGATION_SETS[0]],
      aggregationChoices: SummarySpecGenerator.AGGREGATION_SETS.map(s => [...s]),
      size: TileSize.WIDE
    });
  }

  private categoryCrosstabs(categories: ColumnProfile[], combinations: CategoryCombinationCounter): TileSpec[] {
    return [...this.tableCategoryPairs(categories, combinations), ...this.tableCategoryTriples(categories, combinations)]
      .map(grouping => tileSpecOf({
        dataColumns: grouping.slice(-1),
        groupByColumns: grouping.slice(0, -1),
        aggregations: [Aggregation.COUNT],
        size: TileSize.WIDE
      }));
  }

  private valueRanges(measures: ColumnProfile[], categories: ColumnProfile[]): TileSpec[] {
    const rangeCategories = categories.filter(c => c.distinctCount <= SummarySpecGenerator.MAX_RANGE_CATEGORIES);
    return measures.flatMap(n => rangeCategories.map(c => tileSpecOf({
      dataColumns: [n],
      groupByColumns: [c],
      aggregations: [Aggregation.COUNT],
      valueGroupingColumn: n,
      size: TileSize.WIDE
    })));
  }

  private measureStatistics(measures: ColumnProfile[]): TileSpec[] {
    return measures.map(n => tileSpecOf({
      dataColumns: [n],
      aggregations: [...SummarySpecGenerator.STATISTICS],
      size: TileSize.WIDE
    }));
  }

  private valueRangeCounts(measures: ColumnProfile[]): TileSpec[] {
    return this.rangeMeasures(measures).map(n => tileSpecOf({
      dataColumns: [n],
      aggregations: [Aggregation.COUNT],
      valueGroupingColumn: n,
      size: TileSize.WIDE
    }));
  }

  private measuresByValueRanges(measures: ColumnProfile[]): TileSpec[] {
    return measures.flatMap(n => this.rangeMeasures(measures).filter(m => m !== n).map(m => tileSpecOf({
      dataColumns: [n],
      groupByColumns: [m],
      aggregations: [...SummarySpecGenerator.RANGE_AGGREGATIONS],
      valueGroupingColumn: m,
      size: TileSize.WIDE
    })));
  }

  private categoryCounts(categories: ColumnProfile[]): TileSpec[] {
    return categories.filter(c => c.distinctCount <= SummarySpecGenerator.MAX_TABLE_ROWS).map(c => tileSpecOf({
      dataColumns: [c],
      aggregations: [Aggregation.COUNT],
      size: TileSize.WIDE
    }));
  }

  private categoryCountsOverTime(categories: ColumnProfile[], times: ColumnProfile[]): TileSpec[] {
    return categories.flatMap(c => times
      .filter(t => this.timeRows(t) * c.distinctCount <= SummarySpecGenerator.MAX_HIERARCHY_ROWS)
      .map(t => tileSpecOf({
        dataColumns: [c],
        groupByColumns: [t],
        aggregations: [Aggregation.COUNT],
        size: TileSize.WIDE
      })));
  }

  /**
   * @returns the measures of more distinct values than a table lists, which are grouped by value ranges
   */
  private rangeMeasures(measures: ColumnProfile[]): ColumnProfile[] {
    return measures.filter(m => m.distinctCount > SummarySpecGenerator.MAX_TABLE_ROWS);
  }

  /**
   * @returns the maximum number of rows grouped by the time column, its time buckets that hold values
   */
  private timeRows(time: ColumnProfile): number {
    return Math.min(time.timeBucketCount, time.distinctCount);
  }
}
