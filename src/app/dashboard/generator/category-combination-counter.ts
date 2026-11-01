/**
 * counts the distinct value combinations of column pairs, missing values counted as values, the upper bound of the rows of a
 * summary table grouped by both columns
 */
export class CategoryCombinationCounter {

  private readonly counts = new Map<string, number>();
  private readonly uniformities = new Map<string, boolean>();

  constructor(private readonly entries: object[]) { }

  count(columnName1: string, columnName2: string): number {
    const key = this.keyOf(columnName1, columnName2);
    let count = this.counts.get(key);
    if (count === undefined) {
      count = this.countCombinations(...this.sortedNames(columnName1, columnName2));
      this.counts.set(key, count);
    }
    return count;
  }

  /**
   * @returns whether every value combination of both columns occurs and holds the same number of rows
   */
  isUniform(columnName1: string, columnName2: string): boolean {
    const key = this.keyOf(columnName1, columnName2);
    let uniform = this.uniformities.get(key);
    if (uniform === undefined) {
      uniform = this.computeUniform(...this.sortedNames(columnName1, columnName2));
      this.uniformities.set(key, uniform);
    }
    return uniform;
  }

  private sortedNames(columnName1: string, columnName2: string): [string, string] {
    const [name1, name2] = [columnName1, columnName2].sort();
    return [name1, name2];
  }

  private keyOf(columnName1: string, columnName2: string): string {
    return JSON.stringify(this.sortedNames(columnName1, columnName2));
  }

  private countCombinations(name1: string, name2: string): number {
    const combinations = new Map<unknown, Set<unknown>>();
    for (const entry of this.entries as Record<string, unknown>[]) {
      const value1 = entry[name1];
      const values2 = combinations.get(value1) ?? new Set<unknown>();
      values2.add(entry[name2]);
      combinations.set(value1, values2);
    }
    let count = 0;
    combinations.forEach(values2 => count += values2.size);
    return count;
  }

  private computeUniform(name1: string, name2: string): boolean {
    const rows = new Map<string, number>();
    const values1 = new Set<unknown>();
    const values2 = new Set<unknown>();
    for (const entry of this.entries as Record<string, unknown>[]) {
      const value1 = entry[name1] ?? null;
      const value2 = entry[name2] ?? null;
      values1.add(value1);
      values2.add(value2);
      const key = JSON.stringify([value1, value2]);
      rows.set(key, (rows.get(key) ?? 0) + 1);
    }
    return rows.size > 0 && rows.size === values1.size * values2.size && new Set(rows.values()).size === 1;
  }
}
