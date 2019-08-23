import { Column, TimeUnit } from 'app/shared/model';
import { DateTimeUtils } from 'app/shared/utils';
import { NumberRangeFilter } from './number-range-filter';
import { ValueRange } from 'app/shared/value-range/model/value-range.type';

/**
 * Filtering with time units greater than milliseconds works fine only when individual times are down-rounded
 *
 * @see EntryMapper#roundDownToTargetFormat
 */
export class TimeRangeFilter extends NumberRangeFilter {

   constructor(column: Column, start: number, end: number, selValueRange: ValueRange) {
      super(column, start, end, selValueRange);
   }

   protected initSliderSteps(): void {
      this.selectedStep = DateTimeUtils.timeUnitFromNgFormat(this.column.format);
      if (this.selectedStep === TimeUnit.MONTH || this.selectedStep === TimeUnit.YEAR) {
         this.selectedStep = TimeUnit.DAY;
      }
      this.availableSteps = this.identifyAvailableTimeSteps(this.end - this.start);
      this.defineSelectedStepAbbreviation();
   }

   /**
   * @returns available (selectable) slider steps depending on the overall time range and the column's time format,
   * never a time unit above [[TimeUnit.DAY]] because they are of variable duration
   */
  protected identifyAvailableTimeSteps(duration: number): TimeUnit[] {
      const timeUnits: TimeUnit[] = [this.selectedStep];
      for (const timeUnit of this.potentialTimeUnitsAbove(timeUnits[0])) {
         if (DateTimeUtils.countTimeUnits(duration, timeUnit) < NumberRangeFilter.MIN_REQUIRED_UNITS_PER_SLIDER_STEP_TYPE) {
            break;
         }
         timeUnits.push(timeUnit);
      }
      return timeUnits;
   }

   private potentialTimeUnitsAbove(timeUnit: TimeUnit): TimeUnit[] {
      let potentialTimeUnits = [TimeUnit.SECOND, TimeUnit.MINUTE, TimeUnit.HOUR, TimeUnit.DAY];
      const i = potentialTimeUnits.indexOf(timeUnit);
      if (i !== -1) {
         potentialTimeUnits = potentialTimeUnits.slice(i + 1);
      }
      return potentialTimeUnits;
   }

   onStepChanged(timeStep: any): void {
      this.selectedStep = timeStep;
      this.defineSelectedStepAbbreviation();
      this.defineSliderOptions();
   }

   defineSelectedStepAbbreviation(): void {
      this.selectedStepAbbrev = DateTimeUtils.abbreviationOf(this.selectedStep);
   }

   defineSliderOptions(): void {
      this.sliderOptions = {
         floor: this.start,
         ceil: this.end,
         step: DateTimeUtils.toMilliseconds(1, this.selectedStep),
         enforceStep: false,
         draggableRange: true,
         translate: t => DateTimeUtils.formatTime(t, this.availableSteps[0]),
         combineLabels: (l1: string, l2: string) => this.sliderCustomizer.combineLabels(l1, l2)
      }
   }
}
