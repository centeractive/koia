import { ValueRangeFilter } from './value-range-filter';
import { Operator } from '../../model/operator.enum';

describe('ValueRangeFilter', () => {

   it('#name getter setter', () => {
      const filter = new ValueRangeFilter('x', { min: null, max: null });
      filter.name = 'y';
      expect(filter.name).toBe('y');
   });

   it('#isApplicable should return false when initial value range min and max are missing', () => {
      expect(new ValueRangeFilter('x', { min: null, max: null }).isApplicable()).toBeFalsy();
      expect(new ValueRangeFilter('x', { min: undefined, max: undefined }).isApplicable()).toBeFalsy();
      expect(new ValueRangeFilter('x', { min: null, max: undefined }).isApplicable()).toBeFalsy();
      expect(new ValueRangeFilter('x', { min: undefined, max: null }).isApplicable()).toBeFalsy();
   });

   it('#isApplicable should return true when initial value range min or max are present', () => {
      expect(new ValueRangeFilter('x', { min: 0, max: null }).isApplicable()).toBeTruthy();
      expect(new ValueRangeFilter('x', { min: undefined, max: 0 }).isApplicable()).toBeTruthy();
      expect(new ValueRangeFilter('x', { min: 1, max: undefined }).isApplicable()).toBeTruthy();
      expect(new ValueRangeFilter('x', { min: null, max: 1 }).isApplicable()).toBeTruthy();
      expect(new ValueRangeFilter('x', { min: 1, max: 2 }).isApplicable()).toBeTruthy();
   });

   it('#isApplicable should return false when changed value range min and max are missing', () => {

      // given
      const filter = new ValueRangeFilter('x', { min: 1, max: 2 });
      filter.valueRange = { min: null, max: null };

      // when
      const applicable = filter.isApplicable();

      // then
      expect(applicable).toBeFalsy();
      expect(filter.valueRange).toEqual({ min: null, max: null });
   });

   it('#isApplicable should return true when changed value range min or max are presnet', () => {

      // given
      const filter = new ValueRangeFilter('x', { min: null, max: null });
      filter.valueRange = { min: 1, max: null };

      // when
      const applicable = filter.isApplicable();

      // then
      expect(applicable).toBeTruthy();
      expect(filter.valueRange).toEqual({ min: 1, max: null });
   });

   it('#isApplicable should return false when filter was cleared', () => {

      // given
      const filter = new ValueRangeFilter('x', { min: 1, max: 2 });
      filter.clearFilterValue();

      // when
      const applicable = filter.isApplicable();

      // then
      expect(applicable).toBeFalsy();
      expect(filter.valueRange).toEqual({ min: undefined, max: undefined });
   });

   it('#toPropertyFilters should return no filters when value range min and max are undefined', () => {

      // given
      const filter = new ValueRangeFilter('x', { min: undefined, max: undefined });

      // when
      const propertyFilters = filter.toPropertyFilters();

      // then
      expect(propertyFilters.length).toBe(0);
   });

   it('#toPropertyFilters should return no filters when value range min and max are null', () => {

      // given
      const filter = new ValueRangeFilter('x', { min: null, max: null });

      // when
      const propertyFilters = filter.toPropertyFilters();

      // then
      expect(propertyFilters.length).toBe(0);
   });

   it('#toPropertyFilters should return one filter when value range min only is present', () => {

      // given
      const filter = new ValueRangeFilter('x', { min: 1, max: undefined });

      // when
      const propertyFilters = filter.toPropertyFilters();

      // then
      expect(propertyFilters.length).toBe(1);
      expect(propertyFilters[0].name).toBe('x');
      expect(propertyFilters[0].operator).toBe(Operator.GREATER_THAN_OR_EQUAL);
      expect(propertyFilters[0].value).toBe(1);
   });

   it('#toPropertyFilters should return one filter when value range max only is present', () => {

      // given
      const filter = new ValueRangeFilter('x', { min: undefined, max: 2 });

      // when
      const propertyFilters = filter.toPropertyFilters();

      // then
      expect(propertyFilters.length).toBe(1);
      expect(propertyFilters[0].name).toBe('x');
      expect(propertyFilters[0].operator).toBe(Operator.LESS_THAN_OR_EQUAL);
      expect(propertyFilters[0].value).toBe(2);
   });

   it('#toPropertyFilters should return two filters when value range min and max are present', () => {

      // given
      const filter = new ValueRangeFilter('x', { min: 1, max: 2 });

      // when
      const propertyFilters = filter.toPropertyFilters();

      // then
      expect(propertyFilters.length).toBe(2);
      expect(propertyFilters[0].name).toBe('x');
      expect(propertyFilters[0].operator).toBe(Operator.GREATER_THAN_OR_EQUAL);
      expect(propertyFilters[0].value).toBe(1);
      expect(propertyFilters[1].name).toBe('x');
      expect(propertyFilters[1].operator).toBe(Operator.LESS_THAN_OR_EQUAL);
      expect(propertyFilters[1].value).toBe(2);
   });

   it('#toPropertyFilters should return two filters when value range min and max (excluding) are present', () => {

      // given
      const filter = new ValueRangeFilter('x', { min: 1, max: 2, maxExcluding: true });

      // when
      const propertyFilters = filter.toPropertyFilters();

      // then
      expect(propertyFilters.length).toBe(2);
      expect(propertyFilters[0].name).toBe('x');
      expect(propertyFilters[0].operator).toBe(Operator.GREATER_THAN_OR_EQUAL);
      expect(propertyFilters[0].value).toBe(1);
      expect(propertyFilters[1].name).toBe('x');
      expect(propertyFilters[1].operator).toBe(Operator.LESS_THAN);
      expect(propertyFilters[1].value).toBe(2);
   });

   it('#toPropertyFilters should return one filter when inverted and value range min only is present', () => {

      // given
      const filter = new ValueRangeFilter('x', { min: 1, max: undefined }, true);

      // when
      const propertyFilters = filter.toPropertyFilters();

      // then
      expect(propertyFilters.length).toBe(1);
      expect(propertyFilters[0].name).toBe('x');
      expect(propertyFilters[0].operator).toBe(Operator.LESS_THAN);
      expect(propertyFilters[0].value).toBe(1);
   });

   it('#toPropertyFilters should return one filter when inverted and value range max only is present', () => {

      // given
      const filter = new ValueRangeFilter('x', { min: undefined, max: 2 }, true);

      // when
      const propertyFilters = filter.toPropertyFilters();

      // then
      expect(propertyFilters.length).toBe(1);
      expect(propertyFilters[0].name).toBe('x');
      expect(propertyFilters[0].operator).toBe(Operator.GREATER_THAN);
      expect(propertyFilters[0].value).toBe(2);
   });

   it('#toPropertyFilters should return two filters when inverted and value range min and max are present', () => {

      // given
      const filter = new ValueRangeFilter('x', { min: 1, max: 2 }, true);

      // when
      const propertyFilters = filter.toPropertyFilters();

      // then
      expect(propertyFilters.length).toBe(2);
      expect(propertyFilters[0].name).toBe('x');
      expect(propertyFilters[0].operator).toBe(Operator.LESS_THAN);
      expect(propertyFilters[0].value).toBe(1);
      expect(propertyFilters[1].name).toBe('x');
      expect(propertyFilters[1].operator).toBe(Operator.GREATER_THAN);
      expect(propertyFilters[1].value).toBe(2);
   });

   it('#toPropertyFilters should return two filters when inverted and value range min and max (excluding) are present', () => {

      // given
      const filter = new ValueRangeFilter('x', { min: 1, max: 2, maxExcluding: true }, true);

      // when
      const propertyFilters = filter.toPropertyFilters();

      // then
      expect(propertyFilters.length).toBe(2);
      expect(propertyFilters[0].name).toBe('x');
      expect(propertyFilters[0].operator).toBe(Operator.LESS_THAN);
      expect(propertyFilters[0].value).toBe(1);
      expect(propertyFilters[1].name).toBe('x');
      expect(propertyFilters[1].operator).toBe(Operator.GREATER_THAN_OR_EQUAL);
      expect(propertyFilters[1].value).toBe(2);
   });

   it('#clone', () => {

      // given
      const filter = new ValueRangeFilter('x', { min: 1, max: 2, maxExcluding: true });

      // when
      const clone = filter.clone();

      // then
      expect(clone.name).toBe('x');
      expect(clone.valueRange).toEqual({ min: 1, max: 2, maxExcluding: true });
      expect(clone.inverted).toBeFalsy();
   });

   it('#clone when inverted', () => {

      // given
      const filter = new ValueRangeFilter('x', { min: 1, max: null }, true);

      // when
      const clone = filter.clone();

      // then
      expect(clone.name).toBe('x');
      expect(clone.valueRange).toEqual({ min: 1, max: null, maxExcluding: undefined });
      expect(clone.inverted).toBeTruthy();
   });
});
