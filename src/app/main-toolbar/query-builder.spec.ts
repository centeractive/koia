import { QueryBuilder } from './query-builder';
import { Query, DataType, Column, PropertyFilter, Operator } from 'app/shared/model';
import { NumberRangeFilter } from './range-filter/model/number-range-filter';
import { ValueRangeFilter } from 'app/shared/value-range/model';

describe('QueryBuilder', () => {

   const zipCodeColumn: Column = { name: 'ZIP Code', dataType: DataType.NUMBER, width: 70 };
   const amountColumn: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 70 };
   const percentColumn: Column = { name: 'Percent', dataType: DataType.NUMBER, width: 70 };

   it('#getQuery when no filter is added', () => {

      // when
      const query = new QueryBuilder().getQuery();

      // then
      expect(query).toEqual(new Query());
   });

   it('#getQuery when full text filter is undefined', () => {

      // when
      const query = new QueryBuilder().fullTextFilter(undefined).getQuery();

      // then
      expect(query).toEqual(new Query());
   });

   it('#getQuery when full text filter is empty', () => {

      // when
      const query = new QueryBuilder().fullTextFilter('').getQuery();

      // then
      expect(query).toEqual(new Query());
   });

   it('#getQuery when no property filters are defined', () => {

      // when
      const query = new QueryBuilder().propertyFilters([]).getQuery();

      // then
      expect(query).toEqual(new Query());
   });

   it('#getQuery when non applicable property filters are defined', () => {

      // given
      const propertyFilters = [
         new PropertyFilter('Level', Operator.CONTAINS, ''),
         new PropertyFilter('Account', Operator.EQUAL, undefined),
      ];

      // when
      const query = new QueryBuilder().propertyFilters(propertyFilters).getQuery();

      // then
      expect(query).toEqual(new Query());
   });

   it('#getQuery when property filters are defined', () => {

      // given
      const propertyFilters = [
         new PropertyFilter('Host', Operator.NOT_EMPTY, ''),
         new PropertyFilter('Level', Operator.EQUAL, 'INFO'),
         new PropertyFilter('Account', Operator.EMPTY, 22),
         new PropertyFilter('Amount', Operator.GREATER_THAN, 22)
      ];

      // when
      const query = new QueryBuilder().propertyFilters(propertyFilters).getQuery();

      // then
      expect(query.getFullTextFilter()).toBe(undefined);
      expect(query.getPropertyFilters()).toEqual([
         new PropertyFilter('Host', Operator.NOT_EMPTY, ''),
         new PropertyFilter('Level', Operator.EQUAL, 'INFO'),
         new PropertyFilter('Account', Operator.EMPTY, 22),
         new PropertyFilter('Amount', Operator.GREATER_THAN, 22)
      ]);
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#getQuery when no range filters are defined', () => {

      // when
      const query = new QueryBuilder().rangeFilters([]).getQuery();

      // then
      expect(query).toEqual(new Query());
   });

   it('#getQuery when non applicable range filters are defined', () => {

      // given
      const rangeFilters = [
         new NumberRangeFilter(zipCodeColumn, 1, 10, { min: 1, max: 10 }, false),
      ];

      // when
      const query = new QueryBuilder().rangeFilters(rangeFilters).getQuery();

      // then
      expect(query).toEqual(new Query());
   });

   it('#getQuery when range filters are defined', () => {

      // given
      const rangeFilters = [
         new NumberRangeFilter(zipCodeColumn, 1, 10, { min: 2, max: 10 }, false),
         new NumberRangeFilter(amountColumn, 1, 10, { min: 1, max: 8 }, false),
         new NumberRangeFilter(percentColumn, 1, 10, { min: 2, max: 5 }, true)
      ];

      // when
      const query = new QueryBuilder().rangeFilters(rangeFilters).getQuery();

      // then
      expect(query.getFullTextFilter()).toBe(undefined);
      expect(query.getPropertyFilters()).toEqual([]);
      expect(query.getValueRangeFilters()).toEqual([
         new ValueRangeFilter('ZIP Code', { min: 2, max: undefined, maxExcluding: undefined }, false),
         new ValueRangeFilter('Amount', { min: undefined, max: 8, maxExcluding: undefined }, false),
         new ValueRangeFilter('Percent', { min: 2, max: 5, maxExcluding: undefined }, true)
      ]);
   });

   it('#getQuery when all kind of filters are defined', () => {

      // given
      const propertyFilters = [
         new PropertyFilter('Host', Operator.NOT_EMPTY, ''),
         new PropertyFilter('Level', Operator.EQUAL, 'INFO'),
      ];
      const rangeFilters = [
         new NumberRangeFilter(zipCodeColumn, 1, 10, { min: 2, max: 10 }, false),
         new NumberRangeFilter(percentColumn, 1, 10, { min: 2, max: 5, maxExcluding: true }, true)
      ];

      // when
      const query = new QueryBuilder()
         .fullTextFilter('abc')
         .propertyFilters(propertyFilters)
         .rangeFilters(rangeFilters)
         .getQuery();

      // then
      expect(query.getFullTextFilter()).toBe('abc');
      expect(query.getPropertyFilters()).toEqual([
         new PropertyFilter('Host', Operator.NOT_EMPTY, ''),
         new PropertyFilter('Level', Operator.EQUAL, 'INFO'),
      ]);
      expect(query.getValueRangeFilters()).toEqual([
         new ValueRangeFilter('ZIP Code', { min: 2, max: undefined, maxExcluding: undefined }, false),
         new ValueRangeFilter('Percent', { min: 2, max: 5, maxExcluding: true }, true)
      ]);
   });
});
