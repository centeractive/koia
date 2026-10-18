import { NumberUtils } from '../utils/number-utils';
import { NumberFormatter } from '../format/number-formatter';

export class ValueRangeConverter {

   static readonly EMPTY = 'empty';
   static readonly MIN = 'min';
   static readonly MAX = 'max';
   static readonly DELIMITER = ' - ';

   private static readonly numberFormatter = new NumberFormatter();

   static toLabel(min: number, max: number): string {
      if (min == undefined && max == undefined) {
         return ValueRangeConverter.EMPTY;
      }
      const minString = min == undefined ? ValueRangeConverter.MIN : ValueRangeConverter.numberFormatter.format(min);
      const maxString = max == undefined ? ValueRangeConverter.MAX : ValueRangeConverter.numberFormatter.format(max);
      return minString + ValueRangeConverter.DELIMITER + maxString;
   }

   static toMinValue(label: string): number | undefined {
      if (label === ValueRangeConverter.EMPTY) {
         return undefined;
      }
      const value = label.substring(0, label.indexOf(ValueRangeConverter.DELIMITER));
      return value === ValueRangeConverter.MIN ? undefined : NumberUtils.parseNumber(value, undefined);
   }

   static toMaxValue(label: string): number | undefined {
      if (label === ValueRangeConverter.EMPTY) {
         return undefined;
      }
      const value = label.substring(label.lastIndexOf(ValueRangeConverter.DELIMITER) + ValueRangeConverter.DELIMITER.length);
      return value === ValueRangeConverter.MAX ? undefined : NumberUtils.parseNumber(value, undefined);
   }
}
