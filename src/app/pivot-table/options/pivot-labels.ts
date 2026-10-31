import { Column, DataType, TimeUnit } from 'app/shared/model';
import { ColumnNameConverter } from 'app/shared/utils';

/**
 * @returns the label of the time column grouped by the time unit in the pivot table, "<column name> (per <time unit>)" suffixed by
 * ' #' as often as needed to differ from the names of the other columns
 */
export function timeLabelOf(timeColumn: Column, timeUnit: TimeUnit, columns: Column[]): string {
   let label = ColumnNameConverter.toLabel(timeColumn, timeUnit);
   while (columns.some(c => c.name !== timeColumn.name && c.name === label)) {
      label += ' #';
   }
   return label;
}

/**
 * @returns the column shown under the label in the pivot table
 */
export function columnOfLabel(label: string, columns: Column[]): Column {
   return columns.find(c => c.name === label) ??
      columns.find(c => c.dataType === DataType.TIME && timeLabelOf(c, c.groupingTimeUnit, columns) === label);
}
