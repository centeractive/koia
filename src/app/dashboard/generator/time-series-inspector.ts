import { Column, DataType } from 'app/shared/model';
import { isComputedColumn } from 'app/shared/utils/column-utils';
import { ColumnProfile, ColumnRole } from './column-profile';

interface Step {
  time: number;
  value: number;
}

/**
 * inspects the values of time columns, the series of an entry being identified by the values of the series columns
 */
export class TimeSeriesInspector {

  static readonly MAX_DECREASE_RATIO = 0.05;
  static readonly MIN_INCREASE_RATIO = 0.1;

  private readonly sortedEntries = new Map<string, Record<string, unknown>[]>();
  private readonly runningTotals = new Map<string, boolean>();
  private readonly uniformities = new Map<string, boolean>();
  private readonly singleValues = new Map<string, boolean>();

  constructor(private readonly entries: object[], private readonly seriesColumnNames: string[]) { }

  /**
   * @returns the text and boolean columns that are neither computed nor excluded, and the ordinal number categories
   */
  static seriesColumnNamesOf(columns: Column[], profiles: ColumnProfile[], excludedColumnNames: string[]): string[] {
    const names = columns
      .filter(c => (c.dataType === DataType.TEXT || c.dataType === DataType.BOOLEAN) && !isComputedColumn(c)
        && !excludedColumnNames.includes(c.name))
      .map(c => c.name);
    profiles
      .filter(p => p.role === ColumnRole.CATEGORY && p.dataType === DataType.NUMBER && !names.includes(p.name))
      .forEach(p => names.push(p.name));
    return names;
  }

  /**
   * @returns whether the measure accumulates over time within each series, tolerating rare decreases (corrections) but not rare
   * increases (steps)
   */
  isRunningTotal(measure: ColumnProfile, time: ColumnProfile): boolean {
    const key = JSON.stringify([measure.name, time.name]);
    let runningTotal = this.runningTotals.get(key);
    if (runningTotal === undefined) {
      runningTotal = this.computeRunningTotal(measure.name, time.name);
      this.runningTotals.set(key, runningTotal);
    }
    return runningTotal;
  }

  /**
   * @returns whether the time fills its native grid and every time value holds the same number of rows, or the same counts of the
   * values of the specified category
   */
  isUniform(time: ColumnProfile, category?: ColumnProfile): boolean {
    const key = JSON.stringify([time.name, category?.name ?? null]);
    let uniform = this.uniformities.get(key);
    if (uniform === undefined) {
      uniform = time.distinctCount >= 2 && time.distinctCount === time.nativeBucketCount && this.computeUniform(time.name, category?.name);
      this.uniformities.set(key, uniform);
    }
    return uniform;
  }

  /**
   * @returns the categories identifying the series of the measure, undefined when another series column with distinct values
   * splits the series
   */
  seriesKeyCategoriesOf(measure: ColumnProfile, categories: ColumnProfile[]): ColumnProfile[] | undefined {
    const keyNames = this.keyNamesOf(measure.name);
    const keyCategories = categories.filter(c => keyNames.includes(c.name));
    const covered = keyNames.every(n => keyCategories.some(c => c.name === n) || this.hasSingleValue(n));
    return covered ? keyCategories : undefined;
  }

  /**
   * @returns whether every entry holds a value of the category
   */
  isComplete(category: ColumnProfile): boolean {
    return category.presentCount === this.entries.length;
  }

  private keyNamesOf(measureName: string): string[] {
    return this.seriesColumnNames.filter(n => n !== measureName);
  }

  private hasSingleValue(name: string): boolean {
    let singleValue = this.singleValues.get(name);
    if (singleValue === undefined) {
      const values = new Set((this.entries as Record<string, unknown>[]).map(e => e[name] ?? null));
      singleValue = values.size === 1;
      this.singleValues.set(name, singleValue);
    }
    return singleValue;
  }

  private computeRunningTotal(measureName: string, timeName: string): boolean {
    const keyNames = this.keyNamesOf(measureName);
    const previousSteps = new Map<string, Step>();
    const currentSteps = new Map<string, Step>();
    let comparisons = 0;
    let increases = 0;
    let decreases = 0;
    for (const entry of this.sortedByTime(timeName)) {
      const value = entry[measureName];
      if (typeof value !== 'number') {
        continue;
      }
      const time = entry[timeName] as number;
      const series = JSON.stringify(keyNames.map(n => entry[n]));
      const current = currentSteps.get(series);
      if (current && time > current.time) {
        previousSteps.set(series, current);
      }
      const previous = previousSteps.get(series);
      if (previous) {
        comparisons++;
        if (value > previous.value) {
          increases++;
        } else if (value < previous.value) {
          decreases++;
        }
      }
      currentSteps.set(series, { time, value });
    }
    return increases > 0 && increases >= TimeSeriesInspector.MIN_INCREASE_RATIO * comparisons
      && decreases <= TimeSeriesInspector.MAX_DECREASE_RATIO * (increases + decreases);
  }

  private computeUniform(timeName: string, categoryName: string | undefined): boolean {
    const countsPerTime = new Map<number, Map<string, number>>();
    for (const entry of this.sortedByTime(timeName)) {
      const value = categoryName === undefined ? '' : entry[categoryName];
      if (value === null || value === undefined) {
        continue;
      }
      const time = entry[timeName] as number;
      const counts = countsPerTime.get(time) ?? new Map<string, number>();
      counts.set(String(value), (counts.get(String(value)) ?? 0) + 1);
      countsPerTime.set(time, counts);
    }
    const signatures = new Set([...countsPerTime.values()].map(counts => JSON.stringify([...counts].sort())));
    return signatures.size === 1;
  }

  private sortedByTime(timeName: string): Record<string, unknown>[] {
    let sorted = this.sortedEntries.get(timeName);
    if (!sorted) {
      sorted = (this.entries as Record<string, unknown>[]).filter(e => typeof e[timeName] === 'number')
        .sort((e1, e2) => (e1[timeName] as number) - (e2[timeName] as number));
      this.sortedEntries.set(timeName, sorted);
    }
    return sorted;
  }
}
