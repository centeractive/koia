import { IDataFrame, DataFrame, Series } from 'data-forge';
import { Injectable } from '@angular/core';
import { DataFrameUtils } from 'app/shared/utils/data-frame-utils';
import { ValueGrouping } from './model/value-grouping.type';
import { ValueRange } from './model/value-range.type';
import { ValueRangeConverter } from './value-range-converter';

/**
 * groups the values of individual number columns into value ranges
 */
@Injectable({
  providedIn: 'root'
})
export class ValueRangeGroupingService {

  compute(baseData: IDataFrame<number, object>, groupings: ValueGrouping[]): IDataFrame<number, object> {
    let dataFrame: IDataFrame<number, object> = new DataFrame(baseData);
    for (const grouping of groupings) {
      dataFrame = this.groupByValueRanges(dataFrame, grouping);
    }
    return dataFrame;
  }

  private groupByValueRanges(dataFrame: IDataFrame<number, object>, grouping: ValueGrouping): IDataFrame<number, object> {
    const sortedRangesMax = this.sortedActiveRangesMaxValues(grouping.ranges);
    const series = DataFrameUtils.columnValues<number>(dataFrame, grouping.columnName);
    const values: string[] = [];
    series.forEach(v => values.push(this.toGroupValue(v, sortedRangesMax)));
    return dataFrame.withSeries(grouping.columnName, new Series(values));
  }

  private sortedActiveRangesMaxValues(ranges: ValueRange[]): number[] {
    return ranges
      .filter(r => r.active && Number.isFinite(r.max))
      .map(r => r.max)
      .sort((max1, max2) => max1 - max2);
  }

  private toGroupValue(value: number, sortedRangesMax: number[]): string {
    if (value === null || value === undefined) {
      return ValueRangeConverter.EMPTY;
    }
    let prevRangeMax: number = undefined;
    for (const rangeMax of sortedRangesMax) {
      if (value >= rangeMax) {
        prevRangeMax = rangeMax;
      } else {
        return ValueRangeConverter.toLabel(prevRangeMax, rangeMax);
      }
    }
    return ValueRangeConverter.toLabel(prevRangeMax, undefined);
  }
}
