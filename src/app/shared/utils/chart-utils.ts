import { Column, DataType } from '../model';
import { ChartContext } from '../model/chart';

export class ChartUtils {

   static identifyGroupByColumns(context: ChartContext): Column[] {
      if (context.groupByColumns.length === 0) {
         const numericNonDataCols = context.getNumericColumns().filter(c => !context.dataColumns.includes(c));
         if (numericNonDataCols.length > 0) {
            const timeColumn = numericNonDataCols.find(c => c.dataType === DataType.TIME);
            return timeColumn ? [timeColumn] : numericNonDataCols.slice(0, 1);
         }
         return [];
      }
      return context.groupByColumns;
   }
}
