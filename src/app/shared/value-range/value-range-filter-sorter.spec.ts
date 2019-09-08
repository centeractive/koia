import { ValueRangeFilterSorter } from './value-range-filter-sorter';
import { ValueRangeFilter } from './model';
import { shuffle } from 'd3';

describe('ValueRangeFilterSorter', () => {

   const sortedFilters = [
      new ValueRangeFilter('a', { min: undefined, max: 9 }),
      new ValueRangeFilter('a', { min: -1, max: 9 }),
      new ValueRangeFilter('a', { min: 0, max: 9 }),
      new ValueRangeFilter('a', { min: 1, max: 9 }),
      new ValueRangeFilter('a', { min: 1, max: 9 }, true),
      new ValueRangeFilter('b', { min: undefined, max: 9 }),
      new ValueRangeFilter('b', { min: -1, max: 9 }),
      new ValueRangeFilter('b', { min: 0, max: 9 }),
      new ValueRangeFilter('b', { min: 1, max: 9 }),
      new ValueRangeFilter('b', { min: 1, max: 9 }, true),
      new ValueRangeFilter('c', { min: undefined, max: 9 }),
      new ValueRangeFilter('c', { min: -1, max: 9 }),
      new ValueRangeFilter('c', { min: 0, max: 9 }),
      new ValueRangeFilter('c', { min: 1, max: 9 }),
      new ValueRangeFilter('c', { min: 1, max: 9 }, true)
   ];

   const sorter = new ValueRangeFilterSorter();

   it('#sort should return sorted filters', () => {

      // when
      const filters = sorter.sort(shuffle(sortedFilters.slice(0)));

      // then
      expect(filters).toEqual(sortedFilters);
   });
})
