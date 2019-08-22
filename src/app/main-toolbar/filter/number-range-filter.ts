import { Options } from 'ng5-slider';
import { Column } from 'app/shared/model';
import { NumberUtils } from 'app/shared/utils';
import { ValueRange } from 'app/shared/value-range/model/value-range.type';
import { NumberFormatter } from 'app/shared/format';

export class NumberRangeFilter {

   static readonly MIN_REQUIRED_UNITS_PER_SLIDER_STEP_TYPE = 5;

   column: Column;
   start: number;
   end: number;
   selStart: number;
   selEnd: number;
   availableSteps: any[];
   selectedStep: any;
   selectedStepAbbrev: string;
   rangeOptions: Options;

   private numberFormatter = new NumberFormatter();

   constructor(column: Column, start: number, end: number, selValueRange: ValueRange) {
      this.column = column;
      this.start = start;
      this.end = end;
      this.initSelectedRange(selValueRange);
      this.initSliderSteps();
      this.defineRangeOptions();
   }

   private initSelectedRange(selValueRange: ValueRange) {
      this.selStart = this.start;
      this.selEnd = this.end;
      if (selValueRange) {
         if (selValueRange.min !== null && selValueRange.min !== undefined) {
            this.selStart = selValueRange.min;
         }
         if (selValueRange.max !== null && selValueRange.max !== undefined) {
            this.selEnd = selValueRange.max;
         }
      }
   }

   protected initSliderSteps(): void {
      const diff = this.end - this.start;
      let step = NumberUtils.basePowerOfTen(diff);
      if (diff / step < NumberRangeFilter.MIN_REQUIRED_UNITS_PER_SLIDER_STEP_TYPE) {
         step = step / 10;
      }
      this.availableSteps = [step];
      for (let i = 0; i < 5 || this.availableSteps[0] > 1; i++) {
         this.availableSteps.unshift(this.availableSteps[0] / 10);
      }
      this.selectedStep = this.availableSteps[this.availableSteps.length - 2];
      this.selectedStepAbbrev = 'n';
   }

   formatStep(step: any): any {
      const num = NumberUtils.asNumber(step);
      return num === undefined || num < 1_000 ? step : num.toLocaleString();
   }

   onStepChanged(step: any): void {
      this.selectedStep = step;
      this.defineRangeOptions();
   }

   defineRangeOptions(): void {
      this.rangeOptions = {
         floor: this.start,
         ceil: this.end,
         step: this.selectedStep,
         animate: true,
         enforceStep: false,
         draggableRange: true,
         translate: n => this.numberFormatter.format(n),
         combineLabels: (l1: string, l2: string) => l1 === l2 ? l1 : l1 + ' - ' + l2
      }
   }

   isFiltered(): boolean {
      return this.isStartFiltered() || this.isEndFiltered();
   }

   isStartFiltered(): boolean {
      return this.selStart !== this.start;
   }

   isEndFiltered(): boolean {
      return this.selEnd !== this.end;
   }

   reset(): void {
      this.selStart = this.start;
      this.selEnd = this.end;
   }
}
