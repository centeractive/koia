import { ValueRange } from 'app/shared/model';
import { NumberUtils } from 'app/shared/utils';

export class ForceYComputer {

   /**
    * computes 'forceY' that optionally forces the Y-Axis to be adjusted in case all values of the unique data column are of
    * little difference each
    */
   compute(valueRange: ValueRange): number[] {
      if (valueRange && valueRange.min !== valueRange.max &&
         Math.sign(valueRange.min) === Math.sign(valueRange.max)) {
         return Math.sign(valueRange.min) === 1 ? this.computeMin(valueRange) : this.computeMax(valueRange);
      }
      return undefined;
   }

   private computeMin(valueRange: ValueRange): number[] {
      const diff = valueRange.max - valueRange.min;
      let min = valueRange.min - diff;
      if (valueRange.min > 10) {
         min = Math.floor(min);
      } else {
         const fixedPosition = NumberUtils.startIndexAfterDecimalPoint(valueRange.min) + 1;
         min = NumberUtils.asNumber(min.toFixed(fixedPosition));
      }
      return min < 0 && valueRange.min > 0 ? undefined : [min, undefined];
   }

   private computeMax(valueRange: ValueRange): number[] {
      const diff = valueRange.max - valueRange.min;
      let max = valueRange.max + diff;
      if (valueRange.max < -10) {
         max = Math.ceil(max);
      } else {
         const fixedPosition = NumberUtils.startIndexAfterDecimalPoint(valueRange.max) + 1;
         max = NumberUtils.asNumber(max.toFixed(fixedPosition));
      }
      return max > 0 && valueRange.max < 0 ? undefined : [undefined, max];
   }
}
