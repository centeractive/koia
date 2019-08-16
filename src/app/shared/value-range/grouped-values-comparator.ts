import { NumberUtils } from '../utils/number-utils';
import { ValueRangeGroupingService } from './value-range-grouping.service';

export class GroupedValuesComparator {

   compare(v1: string, v2: string): number {
      return this.toSortableValue(v1) - this.toSortableValue(v2);
   }

   private toSortableValue(value: string): number {
      value = value.substring(0, value.indexOf(' '));
      return value === ValueRangeGroupingService.MIN ? - Number.MAX_VALUE : NumberUtils.parseFloat(value);
   }
}
