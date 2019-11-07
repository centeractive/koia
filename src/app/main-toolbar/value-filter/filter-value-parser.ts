import { PropertyFilter, DataType } from 'app/shared/model';
import { NumberUtils } from 'app/shared/utils';

export class FilterValueParser {

   constructor(private filter: PropertyFilter) {}

   /**
    * Parses the string representation of a filter value. If the filter data type is NUMBER, misplaced thousands separators
    * are ignored (removed) in order to make value editing smoother.
    *
    * @returns the parsed string or number value
    */
   parse(value: string): string | number {
      if (this.filter.dataType === DataType.NUMBER) {
         const num = NumberUtils.parseNumber(NumberUtils.removeThousandsSeparators(value));
         return num === undefined ? value : num;
      }
      return value;
   }
}
