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

   /**
    * @returns the data series name from the entry by considering split column(s) value only,
    * [[undefined]] if no split column is defined or any split column value is empty
    */
   toSplitName(entry: object, splitColumns: Column[]): string | undefined {
      return this.fromSplitColumns(entry, splitColumns) || undefined;
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
      return this.typedValues(groupKey.toString().split(SeriesNameConverter.SEPARATOR), splitColumns.concat(dataColumn));
   }

   /**
    * @returns split column values extracted from the leading tokens of the specified series name
    */
   toSplitValues(seriesName: string, splitColumns: Column[]): (string | number | boolean)[] {
      return this.typedValues(seriesName.split(SeriesNameConverter.SEPARATOR), splitColumns);
   }

   private typedValues(tokens: string[], columns: Column[]): (string | number | boolean)[] {
      return columns.map((c, i) => DataTypeUtils.isNumeric(c.dataType) ?
         NumberUtils.parseMachineNumber(tokens[i]) : DataTypeUtils.toTypedValue(tokens[i], c.dataType, undefined));
   }
}
