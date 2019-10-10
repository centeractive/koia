import { Column } from 'app/shared/model';
import { DataTypeUtils } from 'app/shared/utils/data-type-utils';

export class SeriesNameConverter {

   static SEPARATOR = '⯈';

   /**
    * @returns the data group name from the entry by considering data column and split column(s) value,
    * [[undefined]] if any split column value is empty
    */
   toGroupName(entry: Object, dataColumn: Column, splitColumns: Column[]): string {
      if (splitColumns.length === 0) {
         return '' + entry[dataColumn.name];
      }
      const name = this.fromSplitColumns(entry, splitColumns);
      if (name === undefined) {
         return undefined;
      }
      return name + SeriesNameConverter.SEPARATOR + entry[dataColumn.name];
   }

   /**
    * @returns the data series name from the entry by considering data column name and split column(s) value,
    * [[undefined]] if any split column value is empty
    */
   toSeriesName(entry: Object, dataColumn: Column, splitColumns: Column[]): string {
      if (splitColumns.length === 0) {
         return dataColumn.name;
      }
      const name = this.fromSplitColumns(entry, splitColumns);
      if (name === undefined) {
         return undefined;
      }
      return name + SeriesNameConverter.SEPARATOR + dataColumn.name;
   }

   private fromSplitColumns(entry: Object, splitColumns: Column[]): string {
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
    * @returns values extracted from the specified group name
    */
   toValues(groupName: string, dataColumn: Column, splitColumns: Column[]): any[] {
      const values: any[] = [];
      const columns = splitColumns.concat(dataColumn);
      const tokens = groupName.split(SeriesNameConverter.SEPARATOR);
      for (let i = 0; i < columns.length; i++) {
         values.push(DataTypeUtils.toTypedValue(tokens[i], columns[i].dataType));
      }
      return values;
   }
}
