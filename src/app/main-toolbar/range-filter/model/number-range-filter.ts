import { EventEmitter } from '@angular/core';
import { LabelType, Options } from 'app/ngx-slider/options';
import { Column } from 'app/shared/model';
import { NumberUtils } from 'app/shared/utils';
import { ValueRange } from 'app/shared/value-range/model/value-range.type';
import { Observable } from 'rxjs';
import { RangeSliderCustomizer } from './slider/range-slider-customizer';

export class NumberRangeFilter {

   static readonly MIN_REQUIRED_UNITS_PER_SLIDER_STEP_TYPE = 5;

   column: Column;
   start: number;
   end: number;
   inverted: boolean;
   availableSteps: any[];
   selectedStep: any;
   selectedStepAbbrev: string;
   sliderOptions: Options;
   selValueRange: ValueRange;
   sliderValueRange: ValueRange;

   protected sliderCustomizer = new RangeSliderCustomizer();
   protected adjustedValueRangeEmitter = new EventEmitter<void>();

   /**
    * @param selValueRange if [[ValueRange#maxExcluding]] is <true>, it is automatically set to <false>
    * as soon as the slider high value is changed by the user
    */
   constructor(column: Column, start: number, end: number, selValueRange: ValueRange, inverted: boolean) {
      this.column = column;
      this.start = start;
      this.end = end;
      this.inverted = inverted == undefined ? false : inverted;
      this.initSelectedRange(selValueRange);
      this.initSliderSteps();
      this.defineSliderOptions();
   }

   onAdjustedValueRange(): Observable<void> {
      return this.adjustedValueRangeEmitter.asObservable();
   }

   private initSelectedRange(selValueRange: ValueRange): void {
      this.selValueRange = selValueRange || { min: this.start, max: this.end };
      if (selValueRange) {
         if (selValueRange.min == undefined) {
            this.selValueRange.min = this.start;
         }
         if (selValueRange.max == undefined) {
            this.selValueRange.max = this.end;
            this.selValueRange.maxExcluding = false;
         }
      }
      this.defineSliderValueRange();
   }

   protected defineSliderValueRange(): void {
      this.sliderValueRange = this.selValueRange;
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
      const num = NumberUtils.asNumber(step, undefined);
      return num == undefined || num < 1_000 ? step : num.toLocaleString();
   }

   onStepChanged(step: any): void {
      this.selectedStep = step;
      this.defineSliderOptions();
   }

   defineSliderOptions(): void {
      this.sliderOptions = {
         floor: this.start,
         ceil: this.end,
         step: this.selectedStep,
         animate: true,
         enforceStep: false,
         draggableRange: true,
         translate: (v: number, t: LabelType) => this.sliderCustomizer.labelOf(v, t, this.selValueRange),
         combineLabels: (l1: string, l2: string) => this.sliderCustomizer.combineLabels(l1, l2)
      };
   }

   isFiltered(): boolean {
      return this.isStartFiltered() || this.isEndFiltered();
   }

   isStartFiltered(): boolean {
      return this.selValueRange.min !== this.start;
   }

   isEndFiltered(): boolean {
      return this.selValueRange.max !== this.end;
   }

   reset(): void {
      this.selValueRange.min = this.start;
      this.selValueRange.max = this.end;
      this.selValueRange.maxExcluding = false;
   }
}
