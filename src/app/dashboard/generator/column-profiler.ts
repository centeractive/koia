import { Column, DataType, TimeUnit } from 'app/shared/model';
import { ArrayUtils, CommonUtils, DateTimeUtils, NumberUtils } from 'app/shared/utils';
import { ColumnProfile, ColumnRole } from './column-profile';

interface NumberCounts {
  presentCount: number;
  numericCount: number;
  valueCounts: Map<number, number>;
}

/**
 * profiles the columns that qualify for generated tiles
 */
export class ColumnProfiler {

  static readonly MIN_PRESENT_RATIO = 0.5;
  static readonly MIN_CATEGORIES = 2;
  static readonly MAX_CATEGORIES = 30;
  static readonly MIN_MEASURE_DISTINCT = 3;

  /**
   * @returns the profiles of the qualifying columns in column order
   */
  profile(columns: Column[], entries: object[]): ColumnProfile[] {
    if (!entries.length) {
      return [];
    }
    return columns
      .map(c => this.profileColumn(c, entries))
      .filter(p => p !== undefined);
  }

  private profileColumn(column: Column, entries: object[]): ColumnProfile | undefined {
    switch (column.dataType) {
      case DataType.TEXT:
      case DataType.BOOLEAN:
        return this.profileCategory(column, entries);
      case DataType.NUMBER:
        return this.profileMeasure(column, entries);
      case DataType.TIME:
        return this.profileTime(column, entries);
      default:
        return undefined;
    }
  }

  private profileCategory(column: Column, entries: object[]): ColumnProfile | undefined {
    const valueCounts = new Map<string, number>();
    let presentCount = 0;
    for (const entry of entries) {
      const value = this.valueOf(entry, column);
      if (this.isPresent(value)) {
        presentCount++;
        const key = String(value);
        const count = valueCounts.get(key);
        if (count !== undefined) {
          valueCounts.set(key, count + 1);
        } else if (valueCounts.size <= ColumnProfiler.MAX_CATEGORIES) {
          valueCounts.set(key, 1);
        }
      }
    }
    const distinctCount = valueCounts.size;
    if (!this.hasMinRatio(presentCount, entries) || distinctCount < ColumnProfiler.MIN_CATEGORIES
      || distinctCount > ColumnProfiler.MAX_CATEGORIES) {
      return undefined;
    }
    return {
      name: column.name,
      dataType: column.dataType,
      role: ColumnRole.CATEGORY,
      distinctCount,
      presentCount,
      maxValueCount: this.maxOf(valueCounts.values())
    };
  }

  private profileMeasure(column: Column, entries: object[]): ColumnProfile | undefined {
    const counts = this.countNumbers(column, entries);
    const distinctCount = counts.valueCounts.size;
    if (!this.hasMinRatio(counts.numericCount, entries) || distinctCount < ColumnProfiler.MIN_MEASURE_DISTINCT
      || this.isIdentifier(counts)) {
      return undefined;
    }
    return {
      name: column.name,
      dataType: column.dataType,
      role: ColumnRole.MEASURE,
      distinctCount,
      presentCount: counts.presentCount
    };
  }

  private isIdentifier(counts: NumberCounts): boolean {
    return counts.numericCount === counts.presentCount
      && counts.valueCounts.size === counts.numericCount
      && [...counts.valueCounts.keys()].every(v => Number.isInteger(v));
  }

  private profileTime(column: Column, entries: object[]): ColumnProfile | undefined {
    const counts = this.countNumbers(column, entries);
    if (!this.hasMinRatio(counts.numericCount, entries)) {
      return undefined;
    }
    const clone = CommonUtils.clone(column);
    DateTimeUtils.defineTimeUnits([clone], entries);
    const timeUnit = clone.groupingTimeUnit;
    if (!timeUnit || timeUnit === TimeUnit.MILLISECOND) {
      return undefined;
    }
    const valueRange = ArrayUtils.numberValueRange(entries, column.name);
    return {
      name: column.name,
      dataType: column.dataType,
      role: ColumnRole.TIME,
      distinctCount: counts.valueCounts.size,
      presentCount: counts.presentCount,
      maxValueCount: this.maxOf(counts.valueCounts.values()),
      groupingTimeUnit: timeUnit,
      timeBucketCount: Math.floor(DateTimeUtils.countTimeUnits(valueRange.max - valueRange.min, timeUnit)) + 1
    };
  }

  private countNumbers(column: Column, entries: object[]): NumberCounts {
    const counts: NumberCounts = { presentCount: 0, numericCount: 0, valueCounts: new Map<number, number>() };
    for (const entry of entries) {
      const value = this.valueOf(entry, column);
      if (this.isPresent(value)) {
        counts.presentCount++;
        if (typeof value === 'number' && NumberUtils.isNumber(value, undefined)) {
          counts.numericCount++;
          counts.valueCounts.set(value, (counts.valueCounts.get(value) ?? 0) + 1);
        }
      }
    }
    return counts;
  }

  private maxOf(counts: Iterable<number>): number {
    let max = 0;
    for (const count of counts) {
      max = Math.max(max, count);
    }
    return max;
  }

  private valueOf(entry: object, column: Column): unknown {
    return (entry as Record<string, unknown>)[column.name];
  }

  private isPresent(value: unknown): boolean {
    return value !== null && value !== undefined;
  }

  private hasMinRatio(count: number, entries: object[]): boolean {
    return count >= ColumnProfiler.MIN_PRESENT_RATIO * entries.length;
  }
}
