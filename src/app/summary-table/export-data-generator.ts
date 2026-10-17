import { DatePipe } from '@angular/common';
import { IDataFrame } from 'data-forge';
import { SummaryContext, DataType } from 'app/shared/model';
import { DateTimeUtils, ColumnNameConverter, DataFrameUtils } from 'app/shared/utils';

export class ExportDataGenerator {

   private datePipe = new DatePipe('en-US');

   generate(context: SummaryContext, dataFrame: IDataFrame<number, object>, overalls: number[]): object[] {
      const data = this.formatTimeColumns(context, dataFrame).toArray();
      data.push(this.createOverallRow(dataFrame.getColumnNames(), overalls));
      return data;
   }

   private formatTimeColumns(context: SummaryContext, dataFrame: IDataFrame<number, object>) {
      context.groupByColumns.filter(c => c.dataType === DataType.TIME).forEach(c => {
         dataFrame = DataFrameUtils.transformColumn(dataFrame, ColumnNameConverter.toLabel(c, c.groupingTimeUnit), (time: number) => isNaN(time) ? '' : this.datePipe.transform(time, DateTimeUtils.ngFormatOf(c.groupingTimeUnit)));
      });
      return dataFrame;
   }

   private createOverallRow(columnNames: string[], overalls: number[]): object {
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
