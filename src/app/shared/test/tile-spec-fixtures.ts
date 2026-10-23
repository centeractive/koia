import { CategoryCombinationCounter } from 'app/dashboard/generator/category-combination-counter';
import { ColumnProfile, ColumnRole } from 'app/dashboard/generator/column-profile';
import { TileSpec } from 'app/dashboard/generator/tile-spec';
import { DataType, TimeUnit } from 'app/shared/model';

export function categoryProfile(name: string, distinctCount: number, maxValueCount = 10, dataType = DataType.TEXT): ColumnProfile {
  return { name, dataType, role: ColumnRole.CATEGORY, distinctCount, presentCount: 100, maxValueCount };
}

export function measureProfile(name: string, presentCount = 100, distinctCount = 50): ColumnProfile {
  return { name, dataType: DataType.NUMBER, role: ColumnRole.MEASURE, distinctCount, presentCount };
}

export function timeProfile(name: string, maxValueCount: number, timeBucketCount = 10, distinctCount = 50): ColumnProfile {
  return {
    name, dataType: DataType.TIME, role: ColumnRole.TIME, distinctCount, presentCount: 100, maxValueCount,
    groupingTimeUnit: TimeUnit.DAY, timeBucketCount
  };
}

export function combinationCounterOf(count: (name1: string, name2: string) => number): CategoryCombinationCounter {
  const counter = new CategoryCombinationCounter([]);
  vi.spyOn(counter, 'count').mockImplementation(count);
  return counter;
}

/**
 * counts the combinations of two categories as the product of their distinct counts
 */
export function productCombinationCounter(profiles: ColumnProfile[]): CategoryCombinationCounter {
  const distinctCount = (name: string) => profiles.find(p => p.name === name).distinctCount;
  return combinationCounterOf((name1, name2) => distinctCount(name1) * distinctCount(name2));
}

/**
 * @returns the chart type or 'table', the data, group-by and split column names of the spec
 */
export function describeTileSpec(spec: TileSpec): string {
  const namesOf = (profiles: ColumnProfile[]) => profiles.map(p => p.name).join(',');
  return (spec.chartType?.type ?? 'table') + ' ' + namesOf(spec.dataColumns) + ' by ' + namesOf(spec.groupByColumns)
    + ' split ' + namesOf(spec.splitColumns);
}
