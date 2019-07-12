import { Options } from 'ng5-slider';
import { Column, Query, TimeUnit } from 'app/shared/model';
import { DateTimeUtils } from 'app/shared/utils';

/**
 * Filtering with time units greater than milliseconds works fine only when individual times are down-rounded
 *
 * @see EntryMapper#roundDownToTargetFormat
 */
export class TimeRangeFilter {

   static readonly MIN_REQUIRED_TIME_UNITS_PER_SLIDER_STEP_TYPE = 5;

   column: Column;
   timeStart: number;
   timeEnd: number;
   selTimeStart: number;
   selTimeEnd: number;
   availableTimeSteps: TimeUnit[];
   selectedTimeStep: TimeUnit;
   selectedTimeStepAbbrev: string;
   timeRangeOptions: Options;

   constructor(timeColumn: Column, timeStart: number, timeEnd: number, query: Query) {
      this.column = timeColumn;
      this.timeStart = timeStart;
      this.timeEnd = timeEnd;
      this.selTimeStart = timeStart;
      this.selTimeEnd = timeEnd;
      if (query) {
         this.selTimeStart = query.hasTimeStart(timeColumn.name) ? query.getTimeStart(timeColumn.name) : timeStart;
         this.selTimeEnd = query.hasTimeEnd(timeColumn.name) ? query.getTimeEnd(timeColumn.name) : timeEnd;
      }
      this.initTimeRangeSliderSteps();
      this.defineTimeRangeOptions();
   }

   private initTimeRangeSliderSteps(): void {
      this.selectedTimeStep = DateTimeUtils.timeUnitFromNgFormat(this.column.format);
      if (this.selectedTimeStep === TimeUnit.MONTH || this.selectedTimeStep === TimeUnit.YEAR) {
         this.selectedTimeStep = TimeUnit.DAY;
      }
      this.availableTimeSteps = this.identifyAvailableTimeSteps(this.timeEnd - this.timeStart);
      this.defineSelectedTimeStepAbbreviation();
   }

   /**
   * @returns available (selectable) slider steps depending on the overall time range and the column's time format,
   * never a time unit above [[TimeUnit.DAY]] because they are of variable duration
   */
   private identifyAvailableTimeSteps(duration: number): TimeUnit[] {
      const timeUnits: TimeUnit[] = [this.selectedTimeStep];
      for (const timeUnit of this.potentialTimeUnitsAbove(timeUnits[0])) {
         if (DateTimeUtils.countTimeUnits(duration, timeUnit) < TimeRangeFilter.MIN_REQUIRED_TIME_UNITS_PER_SLIDER_STEP_TYPE) {
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

   defineSelectedTimeStepAbbreviation(): void {
      this.selectedTimeStepAbbrev = DateTimeUtils.abbreviationOf(this.selectedTimeStep);
   }

   defineTimeRangeOptions(): void {
      this.timeRangeOptions = {
         floor: this.timeStart,
         ceil: this.timeEnd,
         step: DateTimeUtils.toMilliseconds(1, this.selectedTimeStep),
         enforceStep: false,
         draggableRange: true,
         translate: t => DateTimeUtils.formatTime(t, this.availableTimeSteps[0]),
         combineLabels: (l1: string, l2: string) => l1 === l2 ? l1 : l1 + ' - ' + l2
      }
   }

   onTimeStepChanged(timeStep: TimeUnit): void {
      this.selectedTimeStep = timeStep;
      this.defineSelectedTimeStepAbbreviation();
      this.defineTimeRangeOptions();
   }

   isFiltered(): boolean {
      return this.isStartFiltered() || this.isEndFiltered();
   }

   isStartFiltered(): boolean {
      return this.selTimeStart !== this.timeStart;
   }

   isEndFiltered(): boolean {
      return this.selTimeEnd !== this.timeEnd;
   }

   reset(): void {
      this.selTimeStart = this.timeStart;
      this.selTimeEnd = this.timeEnd;
   }
}
