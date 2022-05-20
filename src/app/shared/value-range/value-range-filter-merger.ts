import { CommonUtils } from '../utils/common-utils';
import { NumberUtils } from '../utils/number-utils';
import { ValueRangeFilter, ValueRange } from './model';
import { ValueRangeUtils } from './value-range-utils';

export class ValueRangeFilterMerger {

   /**
    * merges the second [[ValueRangeFilter]] into the first [[ValueRangeFilter]] if applicable
    *
    * @returns [[true]] when the filters were merged, [[false]] when the filters cannot be merged and remain unchanged
    */
   merge(f1: ValueRangeFilter, f2: ValueRangeFilter): boolean {
      if (!CommonUtils.compare(f1, f2)) {
         if (!f1.inverted && !f2.inverted) {
            if (this.canNonInvertedBeMerged(f1, f2)) {
               f1.valueRange.maxExcluding = this.maxExcluding(f1.valueRange, f2.valueRange);
               f1.valueRange.min = NumberUtils.max(f1.valueRange.min, f2.valueRange.min);
               f1.valueRange.max = NumberUtils.min(f1.valueRange.max, f2.valueRange.max);
               return true;
            }
         } else if (f1.inverted && f2.inverted) {
            if (this.canInvertedBeMerged(f1, f2)) {
               f1.valueRange.max = f2.valueRange.max;
               f1.valueRange.maxExcluding = f2.valueRange.maxExcluding;
               return true;
            }
         }
      }
      return false;
   }

   private canNonInvertedBeMerged(f1: ValueRangeFilter, f2: ValueRangeFilter): boolean {
      const valueRanges = [ValueRangeUtils.toComparable(f1.valueRange), ValueRangeUtils.toComparable(f2.valueRange)];
      valueRanges.sort((r1: ValueRange, r2: ValueRange) => r1.max - r2.max);
      return valueRanges[0].max >= valueRanges[1].min;
   }

   private canInvertedBeMerged(f1: ValueRangeFilter, f2: ValueRangeFilter): boolean {
      return f1.valueRange.max === f2.valueRange.min && f1.valueRange.maxExcluding;
   }

   private maxExcluding(vr1: ValueRange, vr2: ValueRange): boolean {
      if (vr1.max == undefined) {
         return vr2.maxExcluding;
      } else if (vr2.max == undefined) {
         return vr1.maxExcluding;
      }
      if (vr1.max === vr2.max) {
         return vr1.maxExcluding ? true : vr2.maxExcluding;
      }
      return vr1.max < vr2.max ? vr1.maxExcluding : vr2.maxExcluding;
   }
}
