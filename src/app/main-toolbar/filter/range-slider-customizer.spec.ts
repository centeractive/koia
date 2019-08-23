import { RangeSliderCustomizer } from './range-slider-customizer';
import { LabelType } from 'ng5-slider';

describe('RangeSliderCustomizer', () => {

   const customizer = new RangeSliderCustomizer();

   it('#labelOf should return number as string when value of type low', () => {

      // when
      const label = customizer.labelOf(1, LabelType.Low, { min: 0, max: 10 });

      // then
      expect(label).toBe('1');
   });

   it('#labelOf should return number as string when value of type low and max excluding', () => {

      // when
      const label = customizer.labelOf(1, LabelType.Low, { min: 0, max: 10, maxExcluding: true });

      // then
      expect(label).toBe('1');
   });

   it('#labelOf should return number as string when value of type high and max none excluding', () => {

      // when
      const label = customizer.labelOf(9, LabelType.Low, { min: 0, max: 10 });

      // then
      expect(label).toBe('9');
   });

   it('#labelOf should return annoted string when value of type high and max excluding', () => {

      // when
      const label = customizer.labelOf(9, LabelType.High, { min: 0, max: 10, maxExcluding: true });

      // then
      expect(label).toBe('9 excl.');
   });

   it('#combineLabels should return single label when both labels are equal', () => {

      // when
      const label = customizer.combineLabels('123', '123');

      // then
      expect(label).toBe('123');
   });

   it('#combineLabels should return combined label when both labels are different', () => {

      // when
      const label = customizer.combineLabels('123', '456');

      // then
      expect(label).toBe('123 - 456');
   });
});
