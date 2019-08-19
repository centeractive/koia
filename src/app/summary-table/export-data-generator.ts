import { DatePipe } from '@angular/common';
import { IDataFrame } from 'data-forge';
import { SummaryContext, DataType } from 'app/shared/model';
import { CommonUtils, DateTimeUtils, ColumnNameConverter } from 'app/shared/utils';

export class ExportDataGenerator {

   private datePipe = new DatePipe('en-US');

   generate(context: SummaryContext, dataFrame: IDataFrame<number, any>, overalls: number[]): Object[] {
      const data = this.formatTimeColumns(context, dataFrame).toArray();
      data.push(this.createOverallRow(dataFrame.getColumnNames(), overalls));
      return data;
   }

   /**
   * TODO: transformSeries may not work when undefined values are present (see solution at ValueRangeGroupingService#groupByValueRanges)
   */
   private formatTimeColumns(context: SummaryContext, dataFrame: IDataFrame<number, any>) {
      context.groupByColumns.filter(c => c.dataType === DataType.TIME).forEach(c => {
         dataFrame = dataFrame.transformSeries({
            [ColumnNameConverter.toLabel(c, c.groupingTimeUnit)]: t => isNaN(t) ? '' :
               this.datePipe.transform(t, DateTimeUtils.ngFormatOf(c.groupingTimeUnit))
         });
      });
      return dataFrame;
   }

   private createOverallRow(columnNames: string[], overalls: number[]): {} {
      const overallRow = {};
      for (let iCol = 0; iCol < columnNames.length; iCol++) {
         const iOverall = overalls.length - columnNames.length + iCol;
         let value: string | number = '';
         if (iOverall === - 1) {
            value = 'Overall';
         } else if (iOverall >= 0) {
            value = overalls[iOverall];
         }
         overallRow[columnNames[iCol]] = value;
      }
      return overallRow;
   }
}
