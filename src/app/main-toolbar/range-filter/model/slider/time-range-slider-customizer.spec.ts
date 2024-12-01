import { LabelType } from '@angular-slider/ngx-slider';
import { TimeUnit } from 'app/shared/model';
import { DateTimeUtils } from 'app/shared/utils';
import { TimeRangeSliderCustomizer } from './time-range-slider-customizer';

describe('TimeRangeSliderCustomizer', () => {

   const start = toTime(2020);
   const end = toTime(2023);

   it('#labelOf should return formatted time when label type low', () => {
      // when
      const label = customizer(TimeUnit.MILLISECOND).labelOf(0, LabelType.Low);

      // then
      expect(label).toBe('1 Jan 2020 00:00:00 000');
   });

   it('#labelOf should return formatted time when label type low and max excluding', () => {

      // when
      const label = customizer(TimeUnit.DAY).labelOf(0, LabelType.Low);

      // then
      expect(label).toBe('1 Jan 2020');
   });

   it('#labelOf should return formatted time when label type high and max non-excluding', () => {

      // when
      const label = customizer(TimeUnit.DAY).labelOf(9, LabelType.Low);

      // then
      expect(label).toBe('10 Jan 2020');
   });

   it('#labelOf should return annoted string when label type high and max excluding', () => {
      // when
      const label = customizer(TimeUnit.DAY).labelOf(465, LabelType.High);

      // then
      expect(label).toBe('10 Apr 2021 excl.');
   });

   it('#combineLabels should return single label when labels are equal', () => {

      // when
      const label = customizer(TimeUnit.YEAR).combineLabels('2023', '2023');

      // then
      expect(label).toBe('2023');
   });

   it('#combineLabels should return combined label when labels are different', () => {

      // when
      const label = customizer(TimeUnit.YEAR).combineLabels('2020', '2023');

      // then
      expect(label).toBe('2020 - 2023');
   });

   function toTime(year: number): number {
      return new Date(year, 0).getTime();
   }

   function customizer(timeUnit: TimeUnit): TimeRangeSliderCustomizer {
      return new TimeRangeSliderCustomizer(start, timeUnit, sliderCeil(timeUnit));
   }

   function sliderCeil(timeUnit: TimeUnit): number {
      return Math.ceil(DateTimeUtils.diff(start, end, timeUnit));
   }
});
