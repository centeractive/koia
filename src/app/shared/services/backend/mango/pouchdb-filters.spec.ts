import { Operator, PropertyFilter } from 'app/shared/model';
import { ValueRangeFilter } from 'app/shared/value-range/model';
import { PouchDBFilters } from './pouchdb-filters';

describe('PouchDBFilters', () => {

   it('#outside should keep first filter of field and filters merging correctly with it', () => {

      // given
      const propertyFilters = [
         new PropertyFilter('Amount', Operator.GREATER_THAN, 10),
         new PropertyFilter('Amount', Operator.NOT_EQUAL, 20),
         new PropertyFilter('Level', Operator.EQUAL, 'a')
      ];

      // when
      const filters = new PouchDBFilters(propertyFilters, []);

      // then
      expect(filters.outside).toEqual(propertyFilters);
      expect(filters.doubleNegated).toEqual([]);
   });

   it('#doubleNegated should get second EQUAL filter of field', () => {

      // given
      const first = new PropertyFilter('Level', Operator.EQUAL, 'a');
      const second = new PropertyFilter('Level', Operator.EQUAL, 'b');

      // when
      const filters = new PouchDBFilters([first, second], []);

      // then
      expect(filters.outside).toEqual([first]);
      expect(filters.doubleNegated).toEqual([second]);
   });

   it('#doubleNegated should get bounds after EQUAL filter and EQUAL filter after bound of field', () => {

      // given
      const amountEqual = new PropertyFilter('Amount', Operator.EQUAL, 10);
      const amountBound = new PropertyFilter('Amount', Operator.GREATER_THAN_OR_EQUAL, 20);
      const levelBound = new PropertyFilter('Level', Operator.LESS_THAN, 'x');
      const levelEqual = new PropertyFilter('Level', Operator.EQUAL, 'a');

      // when
      const filters = new PouchDBFilters([amountEqual, amountBound, levelBound, levelEqual], []);

      // then
      expect(filters.doubleNegated).toEqual([amountBound, levelEqual]);
   });

   it('#doubleNegated should get second ANY_OF, NONE_OF, NOT_EQUAL and EMPTY filter of field', () => {

      // given
      const operators = [Operator.ANY_OF, Operator.NONE_OF, Operator.NOT_EQUAL, Operator.EMPTY];

      for (const operator of operators) {
         const first = new PropertyFilter('Level', operator, 'a');
         const second = new PropertyFilter('Level', operator, 'b');

         // when
         const filters = new PouchDBFilters([first, second], []);

         // then
         expect(filters.doubleNegated).toEqual([second]);
      }
   });

   it('#doubleNegated should get NOT_EQUAL filter after NONE_OF filter of field', () => {

      // given
      const noneOf = new PropertyFilter('Level', Operator.NONE_OF, 'a');
      const notEqual = new PropertyFilter('Level', Operator.NOT_EQUAL, 'b');

      // when
      const filters = new PouchDBFilters([noneOf, notEqual], []);

      // then
      expect(filters.doubleNegated).toEqual([notEqual]);
   });

   it('#outside should keep CONTAINS filters of same field', () => {

      // given
      const propertyFilters = [
         new PropertyFilter('Level', Operator.CONTAINS, 'a'),
         new PropertyFilter('Level', Operator.CONTAINS, 'b')
      ];

      // when
      const filters = new PouchDBFilters(propertyFilters, []);

      // then
      expect(filters.outside).toEqual(propertyFilters);
   });

   it('#outside should get single bound of inverted range as its filter', () => {

      // given
      const rangeFilter = new ValueRangeFilter('Amount', { min: undefined, max: 20 }, true);

      // when
      const filters = new PouchDBFilters([], [rangeFilter]);

      // then
      expect(filters.outside).toEqual([new PropertyFilter('Amount', Operator.GREATER_THAN, 20)]);
      expect(filters.norRangeFilters).toEqual([]);
   });

   it('#norRangeFilters should get inverted ranges with two or no bounds and ranges matching empty values', () => {

      // given
      const rangeFilters = [
         new ValueRangeFilter('Amount', { min: 5, max: 10 }, true),
         new ValueRangeFilter('Amount', { min: undefined, max: undefined }, true),
         new ValueRangeFilter('Amount', { min: 20, max: undefined }, true, true)
      ];

      // when
      const filters = new PouchDBFilters([], rangeFilters);

      // then
      expect(filters.norRangeFilters).toEqual(rangeFilters);
      expect(filters.outside).toEqual([]);
   });

   it('#missingFieldNames should hold field of nor range and of NOT_EMPTY filter contradicting EMPTY filter once', () => {

      // given
      const emptyFilter = new PropertyFilter('Amount', Operator.EMPTY, '');
      const notEmptyFilter = new PropertyFilter('Amount', Operator.NOT_EMPTY, '');
      const rangeFilters = [
         new ValueRangeFilter('Amount', { min: 5, max: 10 }, true),
         new ValueRangeFilter('Time', { min: 1, max: 3 }, true, true)
      ];

      // when
      const filters = new PouchDBFilters([emptyFilter, notEmptyFilter], rangeFilters);

      // then
      expect(filters.missingFieldNames).toEqual(['Amount']);
      expect(filters.outside).toEqual([emptyFilter]);
   });

   it('#outside should add NOT_EMPTY filter for field filtered by upper bound only', () => {

      // given
      const lessThan = new PropertyFilter('Amount', Operator.LESS_THAN, 30);
      const lessThanOrEqual = new PropertyFilter('Amount', Operator.LESS_THAN_OR_EQUAL, 20);

      // when
      const filters = new PouchDBFilters([lessThan, lessThanOrEqual], []);

      // then
      expect(filters.outside).toEqual([lessThan, lessThanOrEqual, new PropertyFilter('Amount', Operator.NOT_EMPTY, '')]);
   });

   it('#outside should not add NOT_EMPTY filter for field also filtered by lower bound, EMPTY or NOT_EMPTY', () => {

      // given
      const propertyFilters = [
         new PropertyFilter('Amount', Operator.LESS_THAN, 30),
         new PropertyFilter('Amount', Operator.GREATER_THAN, 1),
         new PropertyFilter('Level', Operator.LESS_THAN, 'x'),
         new PropertyFilter('Level', Operator.EMPTY, ''),
         new PropertyFilter('Host', Operator.LESS_THAN, 'x'),
         new PropertyFilter('Host', Operator.NOT_EMPTY, '')
      ];

      // when
      const filters = new PouchDBFilters(propertyFilters, []);

      // then
      expect(filters.outside).toEqual(propertyFilters);
   });
});
