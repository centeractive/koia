import { Aggregation } from 'app/shared/model';
import { CategoryCombinationCounter } from './category-combination-counter';
import { ColumnProfile } from './column-profile';
import { Randomizer } from './randomizer';
import { TileSize, TileSpec } from './tile-spec';
import { pairsOf, tileSpecOf } from './tile-spec-builder';

/**
 * creates the candidate summary table specs of all recipes that apply to the profiled columns
 */
export class SummarySpecGenerator {

  static readonly MAX_TABLE_ROWS = 24;
  static readonly MAX_HIERARCHY_ROWS = 60;
  static readonly MAX_TIME_BUCKETS = 36;
  static readonly MAX_RANGE_CATEGORIES = 8;
  static readonly AGGREGATION_SETS: readonly Aggregation[][] = [
    [Aggregation.MIN, Aggregation.MAX, Aggregation.AVG, Aggregation.SUM],
    [Aggregation.SUM, Aggregation.AVG],
    [Aggregation.AVG, Aggregation.MEDIAN, Aggregation.MAX],
    [Aggregation.SUM]
  ];
  static readonly STATISTICS: readonly Aggregation[] = [Aggregation.MIN, Aggregation.MAX, Aggregation.AVG, Aggregation.MEDIAN];
  static readonly RANGE_AGGREGATIONS: readonly Aggregation[] = [Aggregation.MIN, Aggregation.AVG, Aggregation.MAX];

  generate(categories: ColumnProfile[], measures: ColumnProfile[], times: ColumnProfile[], randomizer: Randomizer,
    combinations: CategoryCombinationCounter): TileSpec[] {
    return [
      ...this.measuresByCategories(measures, categories, randomizer, combinations),
      ...this.measuresOverTime(measures, times, randomizer),
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

  private measuresByCategories(measures: ColumnProfile[], categories: ColumnProfile[], randomizer: Randomizer,
    combinations: CategoryCombinationCounter): TileSpec[] {
    const groupings = [
      ...categories.filter(c => c.distinctCount <= SummarySpecGenerator.MAX_TABLE_ROWS).map(c => [c]),
      ...this.tableCategoryPairs(categories, combinations)
    ];
    return measures.flatMap(n => groupings.map(groupByColumns => tileSpecOf({
      dataColumns: [n],
      groupByColumns,
      aggregations: [...randomizer.pick(SummarySpecGenerator.AGGREGATION_SETS)],
      size: TileSize.WIDE
    })));
  }

  private measuresOverTime(measures: ColumnProfile[], times: ColumnProfile[], randomizer: Randomizer): TileSpec[] {
    return measures.flatMap(n => times
      .filter(t => this.timeRows(t) <= SummarySpecGenerator.MAX_TIME_BUCKETS)
      .map(t => tileSpecOf({
        dataColumns: [n],
        groupByColumns: [t],
        aggregations: [...randomizer.pick(SummarySpecGenerator.AGGREGATION_SETS)],
        size: TileSize.WIDE
      })));
  }

  private categoryCrosstabs(categories: ColumnProfile[], combinations: CategoryCombinationCounter): TileSpec[] {
    return this.tableCategoryPairs(categories, combinations).map(([c1, c2]) => tileSpecOf({
      dataColumns: [c2],
      groupByColumns: [c1],
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
