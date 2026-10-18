import { LanguageService } from 'app/shared/services/language';
import { LabelType } from '@angular-slider/ngx-slider';
import { TimeUnit } from 'app/shared/model';
import { DateTimeUtils } from 'app/shared/utils';

export class TimeRangeSliderCustomizer {

   private min: number;
   private max: number;

   constructor(private start: number, private timeUnit: TimeUnit, private ceil: number) { }

   labelOf(value: number, labelType: LabelType): string {
      if (labelType === LabelType.Low) {
         this.min = value;
      } else if (labelType === LabelType.High) {
         this.max = value;
      }

      let label = this.format(value);
      if (labelType === LabelType.High && this.isMaxExcluding(value)) {
         label += ' ' + LanguageService.instant('filter.range.excluding');
      }
      return label;
   }

   private format(value: number): string {
      const time = DateTimeUtils.add(this.start, this.timeUnit, value);
      return DateTimeUtils.formatTime(time, this.timeUnit, LanguageService.localeId());
   }

   private isMaxExcluding(value: number): boolean {
      return this.timeUnit != TimeUnit.MILLISECOND
         && !!value
         && value !== this.ceil
         && this.min !== this.max;
   }
}
