import { ValueRangeFilter } from './model';
import { ValueRangeUtils } from './value-range-utils';

export class ValueRangeFilterSorter {

   private comparator = new ValueRangeFilterComparator();

   /**
    * sorts [[ValueRangeFilter]]s according to the following rules:
    * 1. ascending by their property name
    * 2. non inverted fliters must preceed inverted ones
    * 3. ascending by the value range min value
    *
    * @returns returns the sorted array
    */
   sort(filters: ValueRangeFilter[]): ValueRangeFilter[] {
      return filters.sort((f1, f2) => this.comparator.compare(f1, f2));
   }
}

class ValueRangeFilterComparator {

   compare(f1: ValueRangeFilter, f2: ValueRangeFilter): number {
      if (f1.propertyName !== f2.propertyName) {
         return f1.propertyName < f2.propertyName ? -1 : 1;
      } else if (f1.inverted && !f2.inverted) {
         return 1;
      } else if (f2.inverted && !f1.inverted) {
         return -1;
      }
      const valueRange1 = ValueRangeUtils.toComparable(f1.valueRange);
      const valueRange2 = ValueRangeUtils.toComparable(f2.valueRange);
      return valueRange1.min - valueRange2.min;
   }
}
