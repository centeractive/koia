import { IDataFrame, DataFrame, Series } from 'data-forge';
import { Injectable } from '@angular/core';
import { ValueGrouping } from './model/value-grouping.type';
import { ValueRange } from './model/value-range.type';

/**
 * groups the values of individual number columns into value ranges
 */
@Injectable({
  providedIn: 'root'
})
export class ValueRangeGroupingService {

  static readonly EMPTY = 'empty';
  static readonly MIN = 'min';
  static readonly MAX = 'max';

  compute(baseData: IDataFrame<number, any>, groupings: ValueGrouping[]): IDataFrame<number, any> {
    let dataFrame: IDataFrame<number, any> = new DataFrame(baseData);
    for (const grouping of groupings) {
      dataFrame = this.groupByValueRanges(dataFrame, grouping);
    }
    return dataFrame;
  }

  private groupByValueRanges(dataFrame: IDataFrame<number, any>, grouping: ValueGrouping): IDataFrame<number, any> {
    const sortedRangesMax = this.sortedActiveRangesMaxValues(grouping.ranges);
    const series = dataFrame.getSeries(grouping.columnName);
    const values: string[] = [];
    series.forEach(v => values.push(this.toGroupValue(v, sortedRangesMax)));
    return dataFrame.withSeries(grouping.columnName, new Series(values));
  }

  private sortedActiveRangesMaxValues(ranges: ValueRange[]): number[] {
    return ranges
      .filter(r => r.active)
      .map(r => r.max)
      .sort((max1, max2) => max1 - max2);
  }

  private toGroupValue(value: number, sortedRangesMax: number[]): string {
    if (value === null || value === undefined) {
      return ValueRangeGroupingService.EMPTY;
    }
    let prevRangeMax = - Number.MAX_VALUE;
    for (const rangeMax of sortedRangesMax) {
      if (value >= rangeMax) {
        prevRangeMax = rangeMax;
      } else {
        const from = prevRangeMax === - Number.MAX_VALUE ? ValueRangeGroupingService.MIN : prevRangeMax.toLocaleString();
        return from + ' - ' + rangeMax.toLocaleString();
      }
    }
    return prevRangeMax.toLocaleString() + ' - ' + ValueRangeGroupingService.MAX;
  }
}
