import { Column, DataType, TimeUnit } from 'app/shared/model';
import { ArrayUtils, CommonUtils, DateTimeUtils, NumberUtils } from 'app/shared/utils';
import { isComputedColumn } from 'app/shared/utils/column-utils';
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
  static readonly MAX_ORDINAL_RANGE = 12;
  static readonly MIN_IDENTIFIER_DISTINCT = 20;

  /**
   * @returns the profiles of the qualifying columns in column order
   */
  profile(columns: Column[], entries: object[]): ColumnProfile[] {
    if (!entries.length) {
      return [];
    }
    return columns
      .filter(c => !isComputedColumn(c))
      .flatMap(c => this.profileColumn(c, entries));
  }

  private profileColumn(column: Column, entries: object[]): ColumnProfile[] {
    switch (column.dataType) {
      case DataType.TEXT:
      case DataType.BOOLEAN:
        return this.profileCategory(column, entries);
      case DataType.NUMBER:
        return this.profileNumber(column, entries);
      case DataType.TIME:
        return this.profileTime(column, entries);
      default:
        return [];
    }
  }

  private profileCategory(column: Column, entries: object[]): ColumnProfile[] {
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
      return [];
    }
    return [{
      name: column.name,
      dataType: column.dataType,
      role: ColumnRole.CATEGORY,
      distinctCount,
      presentCount,
      maxValueCount: this.maxOf(valueCounts.values())
    }];
  }

  /**
   * @returns the measure profile and the ordinal category profile of the number column, each when it qualifies
   */
  private profileNumber(column: Column, entries: object[]): ColumnProfile[] {
    const counts = this.countNumbers(column, entries);
    if (!this.hasMinRatio(counts.numericCount, entries) || this.isIdentifier(counts)) {
      return [];
    }
    const distinctCount = counts.valueCounts.size;
    const profiles: ColumnProfile[] = [];
    if (distinctCount >= ColumnProfiler.MIN_MEASURE_DISTINCT) {
      profiles.push({
        name: column.name,
        dataType: column.dataType,
        role: ColumnRole.MEASURE,
        distinctCount,
        presentCount: counts.presentCount
      });
    }
    if (this.isOrdinal(counts)) {
      profiles.push({
        name: column.name,
        dataType: column.dataType,
        role: ColumnRole.CATEGORY,
        distinctCount,
        presentCount: counts.presentCount,
        maxValueCount: this.maxOf(counts.valueCounts.values())
      });
    }
    return profiles;
  }

  private isOrdinal(counts: NumberCounts): boolean {
    if (!this.isIntegral(counts) || counts.valueCounts.size < ColumnProfiler.MIN_CATEGORIES) {
      return false;
    }
    const values = [...counts.valueCounts.keys()];
    return Math.max(...values) - Math.min(...values) + 1 <= ColumnProfiler.MAX_ORDINAL_RANGE;
  }

  private isIdentifier(counts: NumberCounts): boolean {
    return this.isIntegral(counts)
      && counts.valueCounts.size === counts.numericCount
      && counts.valueCounts.size >= ColumnProfiler.MIN_IDENTIFIER_DISTINCT;
  }

  private isIntegral(counts: NumberCounts): boolean {
    return counts.numericCount === counts.presentCount && [...counts.valueCounts.keys()].every(v => Number.isInteger(v));
  }

  private profileTime(column: Column, entries: object[]): ColumnProfile[] {
    const counts = this.countNumbers(column, entries);
    if (!this.hasMinRatio(counts.numericCount, entries)) {
      return [];
    }
    const clone = CommonUtils.clone(column);
    DateTimeUtils.defineTimeUnits([clone], entries);
    const timeUnit = clone.groupingTimeUnit;
    if (!timeUnit || timeUnit === TimeUnit.MILLISECOND) {
      return [];
    }
    const valueRange = ArrayUtils.numberValueRange(entries, column.name);
    return [{
      name: column.name,
      dataType: column.dataType,
      role: ColumnRole.TIME,
      distinctCount: counts.valueCounts.size,
      presentCount: counts.presentCount,
      maxValueCount: this.maxOf(counts.valueCounts.values()),
      groupingTimeUnit: timeUnit,
      timeBucketCount: Math.floor(DateTimeUtils.countTimeUnits(valueRange.max - valueRange.min, timeUnit)) + 1
    }];
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
