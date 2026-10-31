import { Column, TimeUnit, DataType } from '../model';

export class ColumnNameConverter {

  static readonly RELEVANT_TIME_UNITS = Object.keys(TimeUnit)
    .map(key => TimeUnit[key])
    .filter(u => u !== TimeUnit.MILLISECOND);

  /**
  * @returns a label of pattern "<column name> (per <time unit>)" for time columns of relevant time unit, the column name otherwise
  */
  static toLabel(column: Column, timeUnit: TimeUnit): string {
    if (column.dataType === DataType.TIME && ColumnNameConverter.RELEVANT_TIME_UNITS.includes(timeUnit)) {
      return column.name + this.wrap(timeUnit);
    }
    return column.name;
  }

  private static wrap(timeUnit: TimeUnit): string {
    return ' (per ' + timeUnit + ')';
  }
}
