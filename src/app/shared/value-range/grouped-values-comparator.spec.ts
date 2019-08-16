import { GroupedValuesComparator } from './grouped-values-comparator';
import { shuffle } from 'd3';
import { ValueRangeGroupingService } from '../services';

describe('GroupedValuesComparator', () => {

   const comparator = new GroupedValuesComparator();

   it('should return zero when both values are identical"', () => {
      expect(comparator.compare('min - 0', 'min - 0')).toBe(0);
      expect(comparator.compare('-2 - -1', '-2 - -1')).toBe(0);
      expect(comparator.compare('-1 - 0', '-1 - 0')).toBe(0);
      expect(comparator.compare('0 - 1', '0 - 1')).toBe(0);
      expect(comparator.compare('1 - 2', '1 - 2')).toBe(0);
   });

   it('should return less than zero when first value is "min"', () => {
      expect(comparator.compare('min - 0', '0 - 1')).toBeLessThan(0);
   });

   it('should return greater than zero when second value is "min"', () => {
      expect(comparator.compare('0 - 1', 'min - 0')).toBeGreaterThan(0);
   });

   it('should return less than zero when first value is less', () => {
      expect(comparator.compare('-2000000 - -1', '-1000000 - 0')).toBeLessThan(0);
      expect(comparator.compare('-1 - 0', '0 - 1')).toBeLessThan(0);
      expect(comparator.compare('0 - 1', '1 - 2')).toBeLessThan(0);
      expect(comparator.compare('1000000 - 2', '2000000 - 3')).toBeLessThan(0);
   });

   it('should return greater than zero when first value is greater', () => {
      expect(comparator.compare('-1000000 - 0', '-2000000 - -1')).toBeGreaterThan(0);
      expect(comparator.compare('0 - 1', '-1 - 0')).toBeGreaterThan(0);
      expect(comparator.compare('1 - 2', '0 - 1')).toBeGreaterThan(0);
      expect(comparator.compare('2000000 - 3', '1000000 - 2')).toBeGreaterThan(0);
   });

   it('should ascending sort array', () => {

      // given
      const sortedValues = [
         ValueRangeGroupingService.MIN + ' - -20',
         '-20 - -10',
         '-10 - 0',
         '0 - 10',
         '10 - 20',
         '20 - 30',
         '30 - 40',
         '40 - 50'
      ];
      const values = sortedValues.slice(0);
      shuffle(values);

      // when
      values.sort((v1, v2) => comparator.compare(v1, v2));

      // then
      expect(values).toEqual(sortedValues);
   });
});
