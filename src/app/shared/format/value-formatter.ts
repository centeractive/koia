import { DataType } from '../model/data-type.enum';
import { Column } from '../model/column.type';
import { formatDate } from '@angular/common';
import { NumberUtils } from '../utils/number-utils';
import { NumberFormatter } from './number-formatter';

export class ValueFormatter {

   static readonly DEFAULT_DATETIME_FORMAT = 'd MMM yyyy HH:mm:ss';

   private numberFormatter = new NumberFormatter();

   /**
    * @param localeId provides the locale used to format times, English by default (e.g. for exports), the locale of the
    * user interface language for display
    */
   constructor(private localeId: () => string = () => 'en-US') { }

   formatValue(column: Column, value: string | number | boolean): string | number | boolean {
      if (value == undefined) {
         return '';
      } else if (column.dataType === DataType.TIME && NumberUtils.isNumber(value, undefined)) {
         return formatDate(value as string | number, column.format || ValueFormatter.DEFAULT_DATETIME_FORMAT, this.localeId());
      } else if (column.dataType === DataType.NUMBER) {
         return this.numberFormatter.format(value as number);
      } else if (column.dataType === DataType.BOOLEAN && typeof value === 'boolean') {
         return value ? 'true' : 'false';
      }
      return value;
   }

   // eslint-disable-next-line
   formatCell(column: Column, entry: object, showNestedObjects: boolean): any {
      if (!showNestedObjects && column.dataType === DataType.OBJECT) {
         return entry[column.name] ? '...' : '';
      }
      return this.formatValue(column, entry[column.name]);
   }
}
