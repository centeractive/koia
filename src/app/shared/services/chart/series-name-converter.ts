import { Column } from 'app/shared/model';
import { DataTypeUtils } from 'app/shared/utils/data-type-utils';

export class SeriesNameConverter {

   static SEPARATOR = '⯈';

   /**
    * @returns the data group ID from the entry by considering data column and split column(s) value,
    * [[undefined]] if the data column value or any split column value is empty
    */
   toGroupKey(entry: Object, dataColumn: Column, splitColumns: Column[]): any | undefined {
      if (splitColumns.length === 0) {
         return entry[dataColumn.name];
      }
      const name = this.fromSplitColumns(entry, splitColumns);
      if (!name) {
         return undefined;
      }
      return name + SeriesNameConverter.SEPARATOR + entry[dataColumn.name];
   }

   /**
    * @returns the data series name from the entry by considering data column name and split column(s) value,
    * [[undefined]] if any split column value is empty
    */
   toSeriesName(entry: Object, dataColumn: Column, splitColumns: Column[]): string | undefined {
      if (splitColumns.length === 0) {
         return dataColumn.name;
      }
      const name = this.fromSplitColumns(entry, splitColumns);
      if (!name) {
         return undefined;
      }
      return name + SeriesNameConverter.SEPARATOR + dataColumn.name;
   }

   private fromSplitColumns(entry: Object, splitColumns: Column[]): string | undefined {
      const splitColumnValues = [];
      for (const splitColumn of splitColumns) {
         const splitColumnValue = entry[splitColumn.name];
         if (splitColumnValue === null || splitColumnValue === undefined || splitColumnValue === '') {
            return undefined;
         }
         splitColumnValues.push(splitColumnValue);
      }
      return splitColumnValues.join(SeriesNameConverter.SEPARATOR);
   }

   /**
    * @returns values extracted from the specified group ID
    */
   toValues(groupKey: any, dataColumn: Column, splitColumns: Column[]): any[] {
      const values: any[] = [];
      const columns = splitColumns.concat(dataColumn);
      const tokens = groupKey.toString().split(SeriesNameConverter.SEPARATOR);
      for (let i = 0; i < columns.length; i++) {
         values.push(DataTypeUtils.toTypedValue(tokens[i], columns[i].dataType));
      }
      return values;
   }
}
