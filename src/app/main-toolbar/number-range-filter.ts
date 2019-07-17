import { Options } from 'ng5-slider';
import { Column, ValueRange } from 'app/shared/model';

export class NumberRangeFilter {

   column: Column;
   start: number;
   end: number;
   selStart: number;
   selEnd: number;
   availableSteps: any[];
   selectedStep: any;
   selectedStepAbbrev: string;
   rangeOptions: Options;

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
      this.selectedStep = 1;
   }

   onStepChanged(timeStep: any): void {
      this.selectedStep = timeStep;
      this.defineRangeOptions();
   }

   defineRangeOptions(): void {
      this.rangeOptions = {
         floor: this.start,
         ceil: this.end,
         step: this.selectedStep,
         enforceStep: false,
         draggableRange: true,
         translate: n => n.toLocaleString(),
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
