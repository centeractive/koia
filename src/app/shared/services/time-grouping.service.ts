import { Injectable } from '@angular/core';
import { IDataFrame } from 'data-forge';
import { DateTimeUtils, ColumnNameConverter, DataFrameUtils } from '../utils';
import { Column, TimeUnit } from '../model';

/**
 * groups the time column by time units (minute, hour, day etc.) and renames it using the pattern "<column name> (per <time unit>)"
 */
@Injectable({
   providedIn: 'root'
})
export class TimeGroupingService {

   static readonly EMPTY = 'empty';

   /**
    * @returns a new dataframe with the time column grouped by timeunit and renamed to "<column name> (per <time unit>)".
    * The original dataframe is returned when time column does not exist in any row or when timeunit is not defined.
    */
   groupByTimeUnit(dataFrame: IDataFrame<number, object>, timeColumn: Column): IDataFrame<number, object> {
      return this.group(dataFrame, timeColumn, t => DateTimeUtils.toBaseTime(t, timeColumn.groupingTimeUnit));
   }

   /**
    * @returns a new dataframe with time column grouped by the formatted timeunit and renamed to "<column name> (per <time unit>)".
    * The original dataframe is returned when time column does not exist in any row or when timeunit is not defined.
    */
   groupByFormattedTimeUnit(dataFrame: IDataFrame<number, object>, timeColumn: Column): IDataFrame<number, object> {
      return this.group(dataFrame, timeColumn, t => {
         const date = DateTimeUtils.toBaseDate(t, timeColumn.groupingTimeUnit);
         return date ? DateTimeUtils.formatTime(date.getTime(), timeColumn.groupingTimeUnit) : TimeGroupingService.EMPTY;
      });
   }

   private group(dataFrame: IDataFrame<number, object>, timeColumn: Column, transformer: (t: number) => number | string): IDataFrame<number, object> {
      if (timeColumn.groupingTimeUnit && DataFrameUtils.hasColumn(dataFrame, timeColumn.name)) {
         dataFrame = DataFrameUtils.transformColumn(dataFrame, timeColumn.name, transformer);
         if (timeColumn.groupingTimeUnit === TimeUnit.MILLISECOND) {
            return dataFrame;
         }
         return dataFrame.renameSeries({ [timeColumn.name]: ColumnNameConverter.toLabel(timeColumn, timeColumn.groupingTimeUnit) });
      }
      return dataFrame;
   }
}
