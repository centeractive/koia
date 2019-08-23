import { LabelType } from 'ng5-slider';
import { NumberFormatter } from 'app/shared/format';
import { ValueRange } from 'app/shared/value-range/model';

export class RangeSliderCustomizer {

   private numberFormatter = new NumberFormatter();

   labelOf(value: number, labelType: LabelType, selValueRange: ValueRange): string {
      let label = this.numberFormatter.format(value);
      if (selValueRange && selValueRange.maxExcluding && labelType === LabelType.High) {
         label += ' excl.';
      }
      return label;
   }

   combineLabels(l1: string, l2: string): string {
      return l1 === l2 ? l1 : l1 + ' - ' + l2;
   }
}
