import { Aggregation, DataType } from 'app/shared/model';
import { ColumnProfile } from './column-profile';
import { TileSignature } from './tile-signature';
import { TileSpec } from './tile-spec';

export type TileSpecFields = Pick<TileSpec, 'dataColumns' | 'aggregations' | 'size'> & Partial<Omit<TileSpec, 'signature' | 'key'>>;

export function tileSpecOf(fields: TileSpecFields): TileSpec {
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
    aggregationChoices: fields.aggregationChoices ?? [],
    valueGroupingColumn: fields.valueGroupingColumn,
    stacked: fields.stacked ?? false,
    multiValueAxes: fields.multiValueAxes ?? false,
    showLegend: fields.showLegend ?? false,
    legendPosition: fields.legendPosition ?? 'top',
    size: fields.size,
    timeChart: fields.timeChart ?? false
  };
}

export function pairsOf<T>(items: T[]): T[][] {
  return items.flatMap((p1, i) => items.slice(i + 1).map(p2 => [p1, p2]));
}

export function triplesOf<T>(items: T[]): T[][] {
  return items.flatMap((t1, i) => pairsOf(items.slice(i + 1)).map(pair => [t1, ...pair]));
}

export const MAX_SERIES = 6;
export const MAX_AXIS_CATEGORIES = 12;

export function seriesCategoriesOf(categories: ColumnProfile[]): ColumnProfile[] {
  return categories.filter(c => c.distinctCount <= MAX_SERIES);
}

export function unsplitAndSplitBy(categories: ColumnProfile[]): ColumnProfile[][] {
  return [[], ...categories.map(c => [c])];
}

/**
 * @returns whether every value of the category occurs equally often
 */
export function isUniformCategory(category: ColumnProfile): boolean {
  return category.maxValueCount * category.distinctCount === category.presentCount;
}

/**
 * @returns the text categories whose values fit a category axis
 */
export function axisCategoriesOf(categories: ColumnProfile[]): ColumnProfile[] {
  return categories.filter(c => c.dataType === DataType.TEXT && c.distinctCount <= MAX_AXIS_CATEGORIES);
}

/**
 * @returns the maximum number of rows grouped by the time column, its time buckets that hold values
 */
export function timeRowsOf(time: ColumnProfile): number {
  return Math.min(time.timeBucketCount, time.distinctCount);
}
