/**
 * counts the distinct value combinations of column pairs, missing values counted as values, the upper bound of the rows of a
 * summary table grouped by both columns
 */
export class CategoryCombinationCounter {

  private readonly counts = new Map<string, number>();

  constructor(private readonly entries: object[]) { }

  count(columnName1: string, columnName2: string): number {
    const [name1, name2] = [columnName1, columnName2].sort();
    const key = JSON.stringify([name1, name2]);
    let count = this.counts.get(key);
    if (count === undefined) {
      count = this.countCombinations(name1, name2);
      this.counts.set(key, count);
    }
    return count;
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
}
