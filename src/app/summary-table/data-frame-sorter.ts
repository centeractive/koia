import { IDataFrame } from 'data-forge';
import { ElementContext } from 'app/shared/model';
import { Sort } from '@angular/material';
import { ValueRangeConverter } from 'app/shared/value-range';

export class DataFrameSorter {

  /**
   * @returns a new data frame with the sorted data or the original data frame when sorting could not be performed
   * (undefined sort or sort column not contaied in data frame)
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

  private toSortableValue(columnName: string, entry: Object, context: ElementContext): any {
    let value = entry[columnName];
    if (context.hasValueGrouping(columnName)) {
      const minValue = ValueRangeConverter.toMinValue(<string>value);
      value = minValue === undefined ? - Number.MAX_VALUE : minValue;
    }
    return value;
  }
}
