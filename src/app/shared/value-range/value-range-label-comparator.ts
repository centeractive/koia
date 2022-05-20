import { ValueRangeConverter } from './value-range-converter';

export class ValueRangeLabelComparator {

   compare(gv1: string, gv2: string): number {
      if (gv1 === ValueRangeConverter.EMPTY) {
         return gv2 === ValueRangeConverter.EMPTY ? 0 : -1;
      } else if (gv2 === ValueRangeConverter.EMPTY) {
         return 1;
      }
      return this.compareNumbers(ValueRangeConverter.toMinValue(gv1), ValueRangeConverter.toMinValue(gv2));
   }

   private compareNumbers(n1: number, n2: number): number {
      if (n1 == undefined) {
         return n2 == undefined ? 0 : -1;
      } else if (n2 == undefined) {
         return 1;
      }
      return n1 - n2;
   }
}
