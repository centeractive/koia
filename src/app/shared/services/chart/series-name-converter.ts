import { Column } from 'app/shared/model';
import { DataTypeUtils } from 'app/shared/utils/data-type-utils';
import { NumberUtils } from 'app/shared/utils/number-utils';

export class SeriesNameConverter {

   static SEPARATOR = ' ⯈ ';

   /**
    * @returns the data group ID from the entry by considering data column and split column(s) value,
    * [[undefined]] if the data column value or any split column value is empty
    */
   toGroupKey(entry: object, dataColumn: Column, splitColumns: Column[]): string | number | boolean | undefined {
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
   toSeriesName(entry: object, dataColumn: Column, splitColumns: Column[]): string | undefined {
      if (splitColumns.length === 0) {
         return dataColumn.name;
      }
      const name = this.fromSplitColumns(entry, splitColumns);
      if (!name) {
         return undefined;
      }
      return name + SeriesNameConverter.SEPARATOR + dataColumn.name;
   }

   private fromSplitColumns(entry: object, splitColumns: Column[]): string | undefined {
      const splitColumnValues = [];
      for (const splitColumn of splitColumns) {
         const splitColumnValue = entry[splitColumn.name];
         if (splitColumnValue == undefined || splitColumnValue === '') {
            return undefined;
         }
         splitColumnValues.push(splitColumnValue);
      }
      return splitColumnValues.join(SeriesNameConverter.SEPARATOR);
   }

   /**
    * @returns values extracted from the specified group ID
    */
   toValues(groupKey: string | number | boolean, dataColumn: Column, splitColumns: Column[]): (string | number | boolean)[] {
      const values: (string | number | boolean)[] = [];
      const columns = splitColumns.concat(dataColumn);
      const tokens = groupKey.toString().split(SeriesNameConverter.SEPARATOR);
      for (let i = 0; i < columns.length; i++) {
         const dataType = columns[i].dataType;
         values.push(DataTypeUtils.isNumeric(dataType) ? NumberUtils.parseMachineNumber(tokens[i]) : DataTypeUtils.toTypedValue(tokens[i], dataType, undefined));
      }
      return values;
   }
}
