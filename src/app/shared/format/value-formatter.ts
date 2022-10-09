import { DataType } from '../model/data-type.enum';
import { Column } from '../model/column.type';
import { DatePipe } from '@angular/common';
import { NumberUtils } from '../utils/number-utils';
import { NumberFormatter } from './number-formatter';

export class ValueFormatter {

   static readonly DEFAULT_DATETIME_FORMAT = 'd MMM yyyy HH:mm:ss';

   private datePipe = new DatePipe('en-US');
   private numberFormatter = new NumberFormatter();

   formatValue(column: Column, value: string | number | boolean): any {
      if (value == undefined) {
         return '';
      } else if (column.dataType === DataType.TIME && NumberUtils.isNumber(value, undefined)) {
         return this.datePipe.transform(value as string | number, column.format || ValueFormatter.DEFAULT_DATETIME_FORMAT);
      } else if (column.dataType === DataType.NUMBER) {
         return this.numberFormatter.format(value as number);
      } else if (column.dataType === DataType.BOOLEAN && typeof value === 'boolean') {
         return value ? 'true' : 'false';
      }
      return value;
   }
}
