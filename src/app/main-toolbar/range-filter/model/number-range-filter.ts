import { EventEmitter } from '@angular/core';
import { Column, TimeUnit } from 'app/shared/model';
import { NumberUtils } from 'app/shared/utils';
import { LanguageService } from 'app/shared/services/language';
import { ValueRange } from 'app/shared/value-range/model/value-range.type';
import { Observable } from 'rxjs';
import { NumberRangeSliderCustomizer } from './slider/number-range-slider-customizer';
import { combineSliderLabels } from './slider/combine-slider-labels';
import { LabelType, Options } from '@angular-slider/ngx-slider';

export class NumberRangeFilter {

   static readonly MIN_REQUIRED_UNITS_PER_SLIDER_STEP_TYPE = 5;

   column: Column;
   start: number;
   end: number;
   inverted: boolean;
   availableSteps: (number | TimeUnit)[];
   selectedStep: number | TimeUnit;
   selectedStepAbbrev: string;
   sliderOptions: Options;
   selValueRange: ValueRange;
   sliderValueRange: ValueRange;

   protected adjustedValueRangeEmitter = new EventEmitter<void>();

   /**
    * @param selValueRange if [[ValueRange#maxExcluding]] is <true>, it is automatically set to <false>
    * as soon as the slider high value is changed by the user
    * @see RangeFilterComponent#onHighValueChanged
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
      const steps: number[] = [step];
      for (let i = 0; i < 5 || steps[0] > 1; i++) {
         steps.unshift(steps[0] / 10);
      }
      this.availableSteps = steps;
      this.selectedStep = steps[steps.length - 2];
      this.selectedStepAbbrev = 'n';
   }

   formatStep(step: number | TimeUnit): string | number {
      const num = NumberUtils.asNumber(step, undefined);
      return num == undefined || num < 1_000 ? step : num.toLocaleString(LanguageService.localeId());
   }

   onStepChanged(step: number | TimeUnit): void {
      this.selectedStep = step;
      this.defineSliderOptions();
   }

   defineSliderOptions(): void {
      const customizer = new NumberRangeSliderCustomizer();
      this.sliderOptions = {
         floor: this.start,
         ceil: this.end,
         step: this.selectedStep as number,
         animate: true,
         enforceStep: false,
         draggableRange: true,
         translate: (v: number, t: LabelType) => customizer.labelOf(v, t, this.selValueRange),
         combineLabels: combineSliderLabels
      };
   }

   isFiltered(): boolean {
      return this.inverted || this.isStartFiltered() || this.isEndFiltered();
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
      this.inverted = false;
   }
}
