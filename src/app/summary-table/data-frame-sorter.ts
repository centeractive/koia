import { Sort } from '@angular/material/sort';
import { ElementContext } from 'app/shared/model';
import { AggregationKeys } from 'app/shared/services';
import { DataFrameUtils } from 'app/shared/utils';
import { ValueRangeConverter } from 'app/shared/value-range';
import { IDataFrame } from 'data-forge';

export class DataFrameSorter {

  /**
   * @returns a new data frame sorted ascending for direction 'asc' and descending for 'desc', empty values first when ascending, or the
   * original data frame when sort is undefined, its direction is empty (not sorted) or its column is not contained in the data frame
   */
  sort(dataFrame: IDataFrame<number, object>, sort: Sort, context: ElementContext): IDataFrame<number, object> {
    if (!sort?.direction || !dataFrame.getColumnNames().includes(sort.active)) {
      return dataFrame;
    }
    const valueGrouped = new AggregationKeys(context).isColumnName(sort.active) && context.hasValueGrouping(sort.active);
    return DataFrameUtils.orderBy(dataFrame, [row => this.toSortableValue(row[sort.active], valueGrouped)], sort.direction);
  }

  private toSortableValue(value: unknown, valueGrouped: boolean): unknown {
    if (valueGrouped) {
      const minValue = ValueRangeConverter.toMinValue(value as string);
      return minValue == undefined ? - Number.MAX_VALUE : minValue;
    }
    return value;
  }
}
