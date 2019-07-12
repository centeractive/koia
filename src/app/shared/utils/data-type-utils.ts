import { DataType } from '../model/data-type.enum';
import { NumberUtils } from './number-utils';
import { Column } from '../model';

export class DataTypeUtils {

   /**
    * @returns the best matching data type of the specified value or [[undefined]] (DataType#TIME is never returned)
    */
   static typeOf(value: string | number | boolean): DataType {
      if (value !== null && value !== undefined) {
         if (typeof value === 'boolean' || ['TRUE', 'FALSE'].includes(value.toString().toUpperCase())) {
            return DataType.BOOLEAN;
         } else if (NumberUtils.isNumber(value)) {
            return DataType.NUMBER;
         } else {
            return DataType.TEXT;
         }
      }
      return undefined;
   }

   /**
    * @returns the specified value in form of a value that corresponds to given data type
    * or [[undefined]] if value is not compliant with the data type
    */
   static toTypedValue(value: string | number | boolean, dataType: DataType): string | number | boolean {
      if (value === null || value === undefined) {
         return undefined;
      }
      switch (dataType) {
         case DataType.BOOLEAN:
            return DataTypeUtils.asBoolean(value);
         case DataType.NUMBER:
         case DataType.TIME:
            if (typeof value === 'string' || typeof value === 'number') {
               return NumberUtils.asNumber(value);
            }
            return undefined;
         default:
            return value.toString();
      }
   }

   static asBoolean(value: string | number | boolean) {
      if (value === null || value === undefined) {
         return value;
      }
      if (typeof value === 'boolean') {
         return value;
      } else if (value === 0 || value === '0') {
         return false;
      } else if (value === 1 || value === '1') {
         return true;
      } else if (typeof value === 'string') {
         const valueUpperCase = value.toUpperCase();
         if (valueUpperCase === 'TRUE' || valueUpperCase === '+') {
            return true;
         } else if (valueUpperCase === 'FALSE' || valueUpperCase === '-') {
            return false;
         }
      }
      return undefined;
   }

   static iconOf(dataType: DataType): string {
      switch (dataType) {
         case DataType.BOOLEAN:
            return 'check_circle';
         case DataType.NUMBER:
            return 'looks_one';
         case DataType.TEXT:
            return 'title';
         case DataType.TIME:
            return 'access_time';
         default:
            return undefined;
      }
   }

   /**
    * @returns [[true]] if columns contains any column other than of type [[DataType#NUMBER]] or [[DataType#TIME]],
    * [[false]] otherwise
    */
   static containsNonNumericColumns(columns: Column[]): boolean {
      if (columns) {
         return columns
            .map(c => c.dataType)
            .filter(t => t !== DataType.NUMBER)
            .filter(t => t !== DataType.TIME)
            .length > 0;
      }
      return false;
   }
}
