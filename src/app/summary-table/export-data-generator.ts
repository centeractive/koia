import { DatePipe } from '@angular/common';
import { IDataFrame } from 'data-forge';
import { Column, SummaryContext, DataType } from 'app/shared/model';
import { AggregationKeys } from 'app/shared/services';
import { LanguageService } from 'app/shared/services/language';
import { DateTimeUtils, DataFrameUtils } from 'app/shared/utils';

export class ExportDataGenerator {

   private datePipe = new DatePipe('en-US');

   generate(context: SummaryContext, dataFrame: IDataFrame<number, object>, overalls: number[]): object[] {
      const keys = new AggregationKeys(context);
      const data = this.formatTimeColumns(context.groupByColumns, keys, dataFrame).toArray();
      data.push(this.createOverallRow(keys, overalls));
      return data;
   }

   /**
    * @returns the columns among the specified ones whose exported values are converted by data type, i.e. the columns keyed by their
    * name except time columns, whose values are already formatted
    */
   columnsOf(context: SummaryContext, columns: Column[]): Column[] {
      const keys = new AggregationKeys(context);
      return columns.filter(c => c.dataType !== DataType.TIME && keys.isColumnName(c.name));
   }

   private formatTimeColumns(groupByColumns: Column[], keys: AggregationKeys, dataFrame: IDataFrame<number, object>) {
      groupByColumns.forEach((c, i) => {
         if (c.dataType === DataType.TIME) {
            dataFrame = DataFrameUtils.transformColumn(dataFrame, keys.groupBy[i], (time: number) => isNaN(time) ? '' : this.datePipe.transform(time, DateTimeUtils.ngFormatOf(c.groupingTimeUnit)));
         }
      });
      return dataFrame;
   }

   private createOverallRow(keys: AggregationKeys, overalls: number[]): object {
      const overallRow = {};
      keys.leading.forEach((key, i) => overallRow[key] = i === keys.leading.length - 1 ? LanguageService.instant('summary.overall') : '');
      keys.aggregations.forEach((key, i) => overallRow[key] = overalls[i]);
      return overallRow;
   }
}
