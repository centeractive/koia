import { IDataFrame } from 'data-forge';
import { ElementContext } from 'app/shared/model';
import { Sort } from '@angular/material/sort';
import { ValueRangeConverter } from 'app/shared/value-range';

export class DataFrameSorter {

  /**
   * @returns a new data frame with the sorted data or the original data frame when sorting could not be performed
   * (when sort is undefined or sort column is not contained in the data frame)
   */
  sort(dataFrame: IDataFrame<number, any>, sort: Sort, context: ElementContext): IDataFrame<number, any> {
    if (!sort || !dataFrame.getColumnNames().includes(sort.active)) {
      return dataFrame;
    }
    if (sort.direction === 'asc') {
      return dataFrame.orderBy(row => this.toSortableValue(sort.active, row, context));
    } else {
      return dataFrame.orderByDescending(row => this.toSortableValue(sort.active, row, context));
    }
  }

  private toSortableValue(columnName: string, entry: object, context: ElementContext): any {
    let value = entry[columnName];
    if (context.hasValueGrouping(columnName)) {
      const minValue = ValueRangeConverter.toMinValue(value as string);
      value = minValue == undefined ? - Number.MAX_VALUE : minValue;
    }
    return value;
  }
}
