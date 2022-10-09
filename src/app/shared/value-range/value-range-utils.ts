import { ValueRange } from './model';
import { CommonUtils } from '../utils/common-utils';

export class ValueRangeUtils {

   static toComparable(valueRange: ValueRange): ValueRange {
      const vr = CommonUtils.clone(valueRange) as ValueRange;
      vr.min = vr.min == undefined ? Number.MIN_SAFE_INTEGER : vr.min;
      vr.max = vr.max == undefined ? Number.MAX_SAFE_INTEGER : vr.max;
      return vr;
   }
}
