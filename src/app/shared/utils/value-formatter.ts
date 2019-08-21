import { DataType } from '../model/data-type.enum';
import { Column } from '../model/column.type';
import { DatePipe } from '@angular/common';
import { NumberUtils } from './number-utils';

export class ValueFormatter {

   static readonly DEFAULT_DATETIME_FORMAT = 'd MMM yyyy HH:mm:ss';

   private datePipe = new DatePipe('en-US');

   formatValue(column: Column, value: string | number | boolean): any {
      if (value === null || value === undefined) {
         return '';
      } else if (column.dataType === DataType.TIME && NumberUtils.isNumber(value)) {
         return this.datePipe.transform(value, column.format || ValueFormatter.DEFAULT_DATETIME_FORMAT);
      } else if (column.dataType === DataType.NUMBER) {
         const decimals = NumberUtils.countDecimals(<number>value);
         if (decimals > 3) {
            return (<number>value).toLocaleString(undefined, { minimumFractionDigits: decimals });
         }
         return (<number>value).toLocaleString();
      } else if (column.dataType === DataType.BOOLEAN && typeof value === 'boolean') {
         return value ? 'true' : 'false';
      }
      return value;
   }
}
