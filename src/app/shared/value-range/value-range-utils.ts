import { ValueRange } from './model';
import { CommonUtils } from '../utils/common-utils';

export class ValueRangeUtils {

   static toComparable(valueRange: ValueRange): ValueRange {
      const vr = <ValueRange>CommonUtils.clone(valueRange);
      vr.min = vr.min === undefined || vr.max === null ? Number.MIN_SAFE_INTEGER : vr.min;
      vr.max = vr.max === undefined || vr.max === null ? Number.MAX_SAFE_INTEGER : vr.max;
      return vr;
   }
}
