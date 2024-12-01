import { LabelType } from '@angular-slider/ngx-slider';
import { Column, TimeUnit } from 'app/shared/model';
import { DateTimeUtils } from 'app/shared/utils';
import { ValueRange } from 'app/shared/value-range/model/value-range.type';
import { NumberRangeFilter } from './number-range-filter';
import { adjustTimeValueRange } from './slider/adjust-time-value-range';
import { SliderTimeValueRange } from './slider/slider-time-value-range';
import { TimeRangeSliderCustomizer } from './slider/time-range-slider-customizer';

/**
 * Filtering with time units greater than milliseconds works fine only when individual times are down-rounded
 *
 * @see EntryMapper#roundDownToTargetFormat
 */
export class TimeRangeFilter extends NumberRangeFilter {

   constructor(column: Column, start: number, end: number, selValueRange: ValueRange, inverted: boolean) {
      super(column, start, end, selValueRange, inverted);
   }

   protected override defineSliderValueRange(): void {
      this.sliderValueRange = new SliderTimeValueRange(this.start, this.end, this.selValueRange, () => this.selectedStep);
   }

   protected override initSliderSteps(): void {
      this.selectedStep = DateTimeUtils.timeUnitFromNgFormat(this.column.format);
      if (this.selectedStep === TimeUnit.MONTH || this.selectedStep === TimeUnit.YEAR) {
         this.selectedStep = TimeUnit.DAY;
      }
      this.availableSteps = this.identifyAvailableTimeSteps(this.end - this.start);
      this.defineSelectedStepAbbreviation();
   }

   /**
   * @returns available (selectable) slider steps depending on the overall time range and the column's time format
   */
   protected identifyAvailableTimeSteps(duration: number): TimeUnit[] {
      const timeUnits: TimeUnit[] = [this.selectedStep];
      for (const timeUnit of DateTimeUtils.timeUnitsAbove(timeUnits[0])) {
         if (DateTimeUtils.countTimeUnits(duration, timeUnit) < NumberRangeFilter.MIN_REQUIRED_UNITS_PER_SLIDER_STEP_TYPE) {
            break;
         }
         timeUnits.push(timeUnit);
      }
      return timeUnits;
   }

   override onStepChanged(timeStep: any): void {
      this.selectedStep = timeStep;
      this.adjustValueRange();
      this.defineSelectedStepAbbreviation();
      this.defineSliderOptions();
   }

   private adjustValueRange(): void {
      if (adjustTimeValueRange(this.start, this.end, this.selValueRange, this.selectedStep)) {
         this.adjustedValueRangeEmitter.emit();
      }
   }

   private defineSelectedStepAbbreviation(): void {
      this.selectedStepAbbrev = DateTimeUtils.abbreviationOf(this.selectedStep);
   }

   override defineSliderOptions(): void {
      const ceil = Math.ceil(DateTimeUtils.diff(this.start, this.end, this.selectedStep));
      const customizer = new TimeRangeSliderCustomizer(this.start, this.selectedStep, ceil);
      this.sliderOptions = {
         floor: 0,
         ceil,
         step: 1,
         enforceStep: false,
         draggableRange: true,
         translate: (v: number, t: LabelType) => customizer.labelOf(v, t),
         combineLabels: (l1: string, l2: string) => customizer.combineLabels(l1, l2)
      };
   }

}
