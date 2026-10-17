import { Column } from 'app/shared/model/column.type';

/**
 * @returns the property names of the first entry or, when there is none, the names of the columns
 */
export function propertyNamesOf(data: object[], columns: Column[]): string[] {
  return data.length > 0 ? Object.keys(data[0]) : columns.map(c => c.name);
}
