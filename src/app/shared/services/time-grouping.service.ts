import { Injectable } from '@angular/core';
import { IDataFrame } from 'data-forge';
import { DateTimeUtils, ColumnNameConverter } from '../utils';
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
    * The original dataframe is returned when time column does not exist or when timeunit is not defined.
    */
   groupByTimeUnit(dataFrame: IDataFrame<number, any>, timeColumn: Column): IDataFrame<number, any> {
      return this.group(dataFrame, timeColumn, t => {
         const date = DateTimeUtils.toBaseDate(t, timeColumn.groupingTimeUnit);
         return date ? date.getTime() : undefined;
      });
   }

   /**
    * @returns a new dataframe with time column grouped by the formatted timeunit and renamed to "<column name> (per <time unit>)".
    * The original dataframe is returned when time column does not exist or when timeunit is not defined.
    */
   groupByFormattedTimeUnit(dataFrame: IDataFrame<number, any>, timeColumn: Column): IDataFrame<number, any> {
      return this.group(dataFrame, timeColumn, t => {
         const date = DateTimeUtils.toBaseDate(t, timeColumn.groupingTimeUnit);
         return date ? DateTimeUtils.formatTime(date.getTime(), timeColumn.groupingTimeUnit) : TimeGroupingService.EMPTY;
      });
   }

   private group(dataFrame: IDataFrame<number, any>, timeColumn: Column, transformer: (t: number) => any): IDataFrame<number, any> {
      if (timeColumn.groupingTimeUnit && dataFrame.getColumnNames().includes(timeColumn.name)) {
         dataFrame = dataFrame.transformSeries({ [timeColumn.name]: t => transformer(t) });
         if (timeColumn.groupingTimeUnit === TimeUnit.MILLISECOND) {
            return dataFrame;
         }
         return dataFrame.renameSeries({ [timeColumn.name]: ColumnNameConverter.toLabel(timeColumn, timeColumn.groupingTimeUnit) });
      }
      return dataFrame;
   }
}
