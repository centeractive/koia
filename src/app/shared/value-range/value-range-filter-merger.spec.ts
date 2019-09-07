import { ValueRangeFilterMerger } from './value-range-filter-merger';
import { ValueRangeFilter } from './model';

describe('ValueFilterRangeMerger', () => {

   const merger = new ValueRangeFilterMerger();

   it('#merge should not merge when value ranges cannot be merged', () => {

      // given
      const f1 = new ValueRangeFilter('x', { min: 1, max: 2 });
      const f2 = new ValueRangeFilter('x', { min: 3, max: 4 });

      // when
      const merged = merger.merge(f1, f2);

      // then
      expect(merged).toBeFalsy();
   });

   it('#merge should not merge when both value ranges are same', () => {

      // given
      const f = new ValueRangeFilter('x', { min: 1, max: 2 });

      // when
      const merged = merger.merge(f, f);

      // then
      expect(merged).toBeFalsy();
      expect(f.valueRange).toEqual({ min: 1, max: 2 });
   });

   it('#merge not should merge when both value ranges are same (max excluding)', () => {

      // given
      const f = new ValueRangeFilter('x', { min: 1, max: 2, maxExcluding: true });

      // when
      const merged = merger.merge(f, f);

      // then
      expect(merged).toBeFalsy();
      expect(f.valueRange).toEqual({ min: 1, max: 2, maxExcluding: true });
   });

   it('#merge should merge when first value range max is bigger', () => {

      // given
      const f1 = new ValueRangeFilter('x', { min: 0, max: 10 });
      const f2 = new ValueRangeFilter('x', { min: -10, max: 2 });

      // when
      const merged = merger.merge(f1, f2);

      // then
      expect(merged).toBeTruthy();
      expect(f1.valueRange).toEqual({ min: 0, max: 2, maxExcluding: undefined });
   });

   it('#merge should merge when second value range max is bigger', () => {

      // given
      const f1 = new ValueRangeFilter('x', { min: -10, max: 2 });
      const f2 = new ValueRangeFilter('x', { min: 0, max: 10 });

      // when
      const merged = merger.merge(f1, f2);

      // then
      expect(merged).toBeTruthy();
      expect(f1.valueRange).toEqual({ min: 0, max: 2, maxExcluding: undefined });
   });

   it('#merge should merge when range max value is undefined', () => {

      // given
      const f1 = new ValueRangeFilter('x', { min: undefined, max: 10 });
      const f2 = new ValueRangeFilter('x', { min: 3, max: 12 });

      // when
      const merged = merger.merge(f1, f2);

      // then
      expect(merged).toBeTruthy();
      expect(f1.valueRange).toEqual({ min: 3, max: 10, maxExcluding: undefined });
   });

   it('#merge should merge when range max value is undefined', () => {

      // given
      const f1 = new ValueRangeFilter('x', { min: 5, max: 10 });
      const f2 = new ValueRangeFilter('x', { min: 3, max: undefined });

      // when
      const merged = merger.merge(f1, f2);

      // then
      expect(merged).toBeTruthy();
      expect(f1.valueRange).toEqual({ min: 5, max: 10, maxExcluding: undefined });
   });

   it('#merge should merge when several range values are undefined', () => {

      // given
      const f1 = new ValueRangeFilter('x', { min: undefined, max: 10 });
      const f2 = new ValueRangeFilter('x', { min: 3, max: undefined });

      // when
      const merged = merger.merge(f1, f2);

      // then
      expect(merged).toBeTruthy();
      expect(f1.valueRange).toEqual({ min: 3, max: 10, maxExcluding: undefined });
   });

   it('#merge should merge when values from one range are undefined', () => {

      // given
      const f1 = new ValueRangeFilter('x', { min: undefined, max: undefined });
      const f2 = new ValueRangeFilter('x', { min: 3, max: 5 });

      // when
      const merged = merger.merge(f1, f2);

      // then
      expect(merged).toBeTruthy();
      expect(f1.valueRange).toEqual({ min: 3, max: 5, maxExcluding: undefined });
   });

   it('#merge should merge when single range values is defined', () => {

      // given
      const f1 = new ValueRangeFilter('x', { min: undefined, max: undefined });
      const f2 = new ValueRangeFilter('x', { min: 3, max: undefined });

      // when
      const merged = merger.merge(f1, f2);

      // then
      expect(merged).toBeTruthy();
      expect(f1.valueRange).toEqual({ min: 3, max: undefined, maxExcluding: undefined });
   });

   it('#merge should not retain "max excluding" from value range with higher max value', () => {

      // given
      const f1 = new ValueRangeFilter('x', { min: -10, max: 2 });
      const f2 = new ValueRangeFilter('x', { min: 0, max: 10, maxExcluding: true });

      // when
      const merged = merger.merge(f1, f2);

      // then
      expect(merged).toBeTruthy();
      expect(f1.valueRange).toEqual({ min: 0, max: 2, maxExcluding: undefined });
   });

   it('#merge should retain "max excluding" from value range with smaller max value', () => {

      // given
      const f1 = new ValueRangeFilter('x', { min: -10, max: 2, maxExcluding: true });
      const f2 = new ValueRangeFilter('x', { min: 0, max: 10 });

      // when
      const merged = merger.merge(f1, f2);

      // then
      expect(merged).toBeTruthy();
      expect(f1.valueRange).toEqual({ min: 0, max: 2, maxExcluding: true });
   });
});
