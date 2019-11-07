import { PropertyFilter, DataType } from 'app/shared/model';
import { NumberUtils } from 'app/shared/utils';

export class FilterValueParser {

   constructor(private filter: PropertyFilter) {}

   parse(value: string): string | number {
      if (this.filter.dataType === DataType.NUMBER) {
         const num = NumberUtils.parseNumber(NumberUtils.removeThousandsSeparators(value));
         return num === undefined ? value : num;
      }
      return value;
   }
}
