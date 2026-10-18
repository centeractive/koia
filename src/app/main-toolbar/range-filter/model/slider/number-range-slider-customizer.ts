import { LabelType } from '@angular-slider/ngx-slider';
import { NumberFormatter } from 'app/shared/format';
import { LanguageService } from 'app/shared/services/language';
import { ValueRange } from 'app/shared/value-range/model';

export class NumberRangeSliderCustomizer {

   private numberFormatter = new NumberFormatter();

   labelOf(value: number, labelType: LabelType, range: ValueRange): string {
      let label = this.numberFormatter.format(value);
      if (labelType === LabelType.High && !!range?.maxExcluding) {
         label += ' ' + LanguageService.instant('filter.range.excluding');
      }
      return label;
   }
}
