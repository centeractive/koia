import { Column } from 'app/shared/model/column.type';

/**
 * @returns the property names of all entries in the order of the first entry, a property missing in the first entry is placed
 * at its column position or, when it is no column, at the end; the names of the columns when there is no entry
 */
export function propertyNamesOf(data: object[], columns: Column[]): string[] {
  if (data.length === 0) {
    return columns.map(c => c.name);
  }
  const columnIndexes = new Map(columns.map((c, i) => [c.name, i]));
  const names = Object.keys(data[0]);
  const known = new Set(names);
  for (const entry of data) {
    for (const name of Object.keys(entry).filter(n => !known.has(n))) {
      known.add(name);
      const columnIndex = columnIndexes.get(name);
      const insertAt = columnIndex === undefined ? -1 : names.findIndex(n => columnIndexes.get(n) > columnIndex);
      names.splice(insertAt === -1 ? names.length : insertAt, 0, name);
    }
  }
  return names;
}
