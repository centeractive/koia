import { Column, ChartContext, DataType } from '../model';

export class ChartUtils {

   static guessGroupByColumns(context: ChartContext): Column[] {
      const numericNonDataCols = context.getNumericColumns().filter(c => !context.dataColumns.includes(c));
      if (numericNonDataCols.length > 0) {
         const timeColumn = numericNonDataCols.find(c => c.dataType === DataType.TIME);
         return timeColumn ? [timeColumn] : numericNonDataCols.slice(0, 1);
      }
      return [];
   }
}