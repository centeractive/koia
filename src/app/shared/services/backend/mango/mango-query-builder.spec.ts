import { Column, DataType, Operator } from 'app/shared/model';
import { ValueRangeFilter } from 'app/shared/value-range/model';
import { MangoQueryBuilder } from './mango-query-builder';

describe('MangoQueryBuilder', () => {

   let columns: Column[];

   beforeAll(() => {
      columns = [
         { name: 'ID', dataType: DataType.NUMBER, width: 30 },
         { name: 'Time', dataType: DataType.TIME, width: 100 },
         { name: 'Level', dataType: DataType.TEXT, width: 60 },
         { name: 'Data', dataType: DataType.TEXT, width: 400 },
         { name: 'Host', dataType: DataType.TEXT, width: 80 },
         { name: 'Path', dataType: DataType.TEXT, width: 200 },
         { name: 'Amount', dataType: DataType.NUMBER, width: 50 }
      ];
   });

   it('#containsFilter should return false when no filter was added', () => {

      // given
      const queryBuilder = new MangoQueryBuilder(false, columns);

      // when
      const result = queryBuilder.containsFilter();

      // then
      expect(result).toBe(false);
   });

   it('#containsFilter should return true when full text filter was added', () => {

      // given
      const queryBuilder = new MangoQueryBuilder(false, columns);
      queryBuilder.whereAnyText('abc');

      // when
      const result = queryBuilder.containsFilter();

      // then
      expect(result).toBeTruthy();
   });

   it('#containsFilter should return true when property filter was added', () => {

      // given
      const queryBuilder = new MangoQueryBuilder(false, columns);
      queryBuilder.where('Host', Operator.EQUAL, 'server1');

      // when
      const result = queryBuilder.containsFilter();

      // then
      expect(result).toBeTruthy();
   });

   it('#containsFilter should return true when inverted range filter was added', () => {

      // given
      const queryBuilder = new MangoQueryBuilder(false, columns);
      queryBuilder.whereRangeInverted(new ValueRangeFilter('ID', { min: 1, max: 8 }, true));

      // when
      const result = queryBuilder.containsFilter();

      // then
      expect(result).toBeTruthy();
   });

   it('full text selector for CouchDB', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .whereAnyText('abc')
         .toQuery();

      // then
      const expected = {
         selector: {
            $or: [
               { Level: { $regex: '(?i).*abc.*' } },
               { Data: { $regex: '(?i).*abc.*' } },
               { Host: { $regex: '(?i).*abc.*' } },
               { Path: { $regex: '(?i).*abc.*' } }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('full text selector for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .whereAnyText('abc')
         .toQuery();

      // then
      const expected = {
         selector: {
            $or: [
               { Level: { $regex: /.*abc.*/i } },
               { Data: { $regex: /.*abc.*/i } },
               { Host: { $regex: /.*abc.*/i } },
               { Path: { $regex: /.*abc.*/i } }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('full text selector should escape regex syntax for CouchDB', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .whereAnyText('a(b')
         .toQuery();

      // then
      const expected = {
         selector: {
            $or: [
               { Level: { $regex: '(?i).*a\\(b.*' } },
               { Data: { $regex: '(?i).*a\\(b.*' } },
               { Host: { $regex: '(?i).*a\\(b.*' } },
               { Path: { $regex: '(?i).*a\\(b.*' } }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('full text selector should escape regex syntax for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .whereAnyText('a(b')
         .toQuery();

      // then
      const expected = {
         selector: {
            $or: [
               { Level: { $regex: /.*a\(b.*/i } },
               { Data: { $regex: /.*a\(b.*/i } },
               { Host: { $regex: /.*a\(b.*/i } },
               { Path: { $regex: /.*a\(b.*/i } }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('should build selectors of column named __proto__ without polluting object prototype', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .where('Level', Operator.EQUAL, 'Info')
         .where('__proto__', Operator.EQUAL, 'x')
         .toQuery();

      // then
      expect(({} as Record<string, unknown>)['$eq']).toBeUndefined();
      expect(JSON.stringify(query)).toContain('{"__proto__":{"$eq":"x"}}');
   });

   it('EQUAL text selector', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .where('Level', Operator.EQUAL, 'Info')
         .toQuery();

      // then
      const expected = {
         selector: {
            Level: { $eq: 'Info' }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('EQUAL number selector', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .where('ID', Operator.EQUAL, '22')
         .toQuery();

      // then
      const expected = {
         selector: {
            ID: { $eq: 22 }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('EMPTY selector', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .where('Amount', Operator.EMPTY, '')
         .toQuery();

      // then
      const expected = {
         selector: {
            Amount: { $exists: false }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('ANY_OF selector of text values', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .where('Level', Operator.ANY_OF, 'DEBUG; INFO; WARN', DataType.TEXT)
         .toQuery();

      // then
      const expected = {
         selector: {
            Level: { $in: ['DEBUG', 'INFO', 'WARN'] }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('ANY_OF selector of number values', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .where('Amount', Operator.ANY_OF, '1; 2; 3', DataType.NUMBER)
         .toQuery();

      // then
      const expected = {
         selector: {
            Amount: { $in: [1, 2, 3] }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('ANY_OF selector of time values', () => {

      // given
      const now = new Date().getTime();
      const a_minute_ago = now - 60_000;

      // when
      const query = new MangoQueryBuilder(false, columns)
         .where('Time', Operator.ANY_OF, a_minute_ago + '; ' + now, DataType.TIME)
         .toQuery();

      // then
      const expected = {
         selector: {
            Time: { $in: [a_minute_ago, now] }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('ANY_OF selector of boolean values', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .where('a', Operator.ANY_OF, 'yes; no; yes', DataType.BOOLEAN)
         .toQuery();

      // then
      const expected = {
         selector: {
            a: { $in: [true, false, true] }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('NONE_OF selector of text values', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .where('a', Operator.NONE_OF, 'a; b; c', DataType.TEXT)
         .toQuery();

      // then
      const expected = {
         selector: {
            a: { $nin: ['a', 'b', 'c'] }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('NONE_OF selector of number values', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .where('a', Operator.NONE_OF, '1; 2; 3', DataType.NUMBER)
         .toQuery();

      // then
      const expected = {
         selector: {
            a: { $nin: [1, 2, 3] }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('NONE_OF selector of time values', () => {

      // given
      const now = new Date().getTime();
      const a_minute_ago = now - 60_000;

      // when
      const query = new MangoQueryBuilder(false, columns)
         .where('a', Operator.NONE_OF, a_minute_ago + '; ' + now, DataType.TIME)
         .toQuery();

      // then
      const expected = {
         selector: {
            a: { $nin: [a_minute_ago, now] }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('NONE_OF selector of boolean values', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .where('a', Operator.NONE_OF, 'yes; no; yes', DataType.BOOLEAN)
         .toQuery();

      // then
      const expected = {
         selector: {
            a: { $nin: [true, false, true] }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('inverted ranges selector', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .whereRangeInverted(new ValueRangeFilter('a', { min: undefined, max: 7 }))
         .whereRangeInverted(new ValueRangeFilter('b', { min: -1, max: 5 }))
         .whereRangeInverted(new ValueRangeFilter('c', { min: -12, max: undefined }))
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { a: { $lte: 7 } },
               {
                  $or: [
                     { b: { $gte: -1 } },
                     { b: { $lte: 5 } }
                  ]
               },
               { c: { $gte: -12 } }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('selector with several filters on same field (distinct operators)', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .where('a', Operator.GREATER_THAN, 10)
         .where('a', Operator.LESS_THAN, 20)
         .toQuery();

      // then
      const expected = {
         selector: {
            a: { $gt: 10, $lt: 20 }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('selector with several filters on same field (same operator)', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .where('a', Operator.NOT_EQUAL, 1)
         .where('a', Operator.NOT_EQUAL, 2)
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { a: { $ne: 1 } },
               { a: { $ne: 2 } }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('selector with several contains filters on same field for CouchDB', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .where('a', Operator.CONTAINS, 'x')
         .where('a', Operator.CONTAINS, 'y')
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { a: { $regex: '(?i).*x.*' } },
               { a: { $regex: '(?i).*y.*' } }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('selector with single contains filters (PouchDB)', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('a', Operator.CONTAINS, 'x')
         .toQuery();

      // then
      const expected = {
         selector: {
            a: { $regex: /.*x.*/i }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('selector should return single regex for contains filters on same field (PouchDB)', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('a', Operator.CONTAINS, 'x')
         .where('a', Operator.CONTAINS, 'y')
         .where('a', Operator.CONTAINS, 'z')
         .toQuery();

      // then
      const expected = {
         selector: {
            a: { $regex: /(?=.*x.*)(?=.*y.*)(?=.*z.*)/i }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('selector should escape regex syntax of contains filters on same field (PouchDB)', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('a', Operator.CONTAINS, 'a(b')
         .where('a', Operator.CONTAINS, 'c|d')
         .toQuery();

      // then
      const expected = {
         selector: {
            a: { $regex: /(?=.*a\(b.*)(?=.*c\|d.*)/i }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('selector should escape regex syntax of single contains filter (PouchDB)', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('a', Operator.CONTAINS, 'a(b')
         .toQuery();

      // then
      const expected = {
         selector: {
            a: { $regex: /.*a\(b.*/i }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('selector should escape regex syntax of single contains filter (CouchDB)', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .where('a', Operator.CONTAINS, 'a(b')
         .toQuery();

      // then
      const expected = {
         selector: {
            a: { $regex: '(?i).*a\\(b.*' }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('selector should keep contains filter when other filter on same field precedes it (PouchDB)', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('a', Operator.NOT_EQUAL, 'b')
         .where('a', Operator.CONTAINS, 'x')
         .toQuery();

      // then
      const expected = {
         selector: {
            a: { $ne: 'b', $regex: /.*x.*/i }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('full text selector & sort for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .whereAnyText('abc')
         .sortBy({ active: 'x', direction: 'asc' })
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               {
                  $or: [
                     { Level: { $regex: /.*abc.*/i } },
                     { Data: { $regex: /.*abc.*/i } },
                     { Host: { $regex: /.*abc.*/i } },
                     { Path: { $regex: /.*abc.*/i } }
                  ]
               },
               { x: { $gte: null } }
            ]
         },
         sort: [{ x: 'asc' }],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('full text selector combined with property filter should escape dotted column names', () => {

      // given
      const dottedColumns: Column[] = [
         { name: 'a.b', dataType: DataType.TEXT, width: 10 },
         { name: 'c.d', dataType: DataType.TEXT, width: 10 }
      ];

      // when
      const query = new MangoQueryBuilder(false, dottedColumns)
         .whereAnyText('abc')
         .where('c.d', Operator.EQUAL, 'x')
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { 'c\\.d': { $eq: 'x' } },
               {
                  $or: [
                     { 'a\\.b': { $regex: '(?i).*abc.*' } },
                     { 'c\\.d': { $regex: '(?i).*abc.*' } }
                  ]
               }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('two fields only', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .includeFields(['a', 'b']).toQuery();

      // then
      const expected = {
         fields: ['a', 'b'],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('selector & sort ascending for CouchDB', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .where('a', Operator.GREATER_THAN_OR_EQUAL, '7')
         .sortBy({ active: 'y', direction: 'asc' })
         .toQuery();

      // then
      const expected = {
         selector: {
            a: { $gte: '7' }
         },
         sort: [{ y: 'asc' }],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('selector & sort descending for CouchDB', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .where('a', Operator.NOT_EQUAL, 'b')
         .sortBy({ active: 'x', direction: 'desc' })
         .toQuery();

      // then
      const expected = {
         selector: {
            a: { $ne: 'b' }
         },
         sort: [{ x: 'desc' }],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('sort without filter for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .sortBy({ active: 'x', direction: 'desc' })
         .toQuery();

      // then
      const expected = {
         selector: {
            x: { $gte: null }
         },
         sort: [{ x: 'desc' }],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('sort filtered column for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('x', Operator.NOT_EMPTY, null)
         .sortBy({ active: 'x', direction: 'asc' })
         .toQuery();

      // then
      const expected = {
         selector: {
            'x': { '$gt': null }
         },
         sort: [{ x: 'asc' }],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('sort non-filtered column for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('y', Operator.EQUAL, 'A')
         .sortBy({ active: 'x', direction: 'asc' })
         .toQuery();

      // then
      const expected = {
         selector: {
            '$and': [
               { 'y': { '$eq': 'A' } },
               { 'x': { '$gte': null } }
            ]
         },
         sort: [{ x: 'asc' }],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('combined selector', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .whereAnyText('abc')
         .where('a', Operator.CONTAINS, 'test')
         .where('x', Operator.GREATER_THAN, '8')
         .where('x', Operator.LESS_THAN_OR_EQUAL, '12')
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { a: { $regex: '(?i).*test.*' } },
               { x: { $gt: '8', $lte: '12' } },
               {
                  $or: [
                     { Level: { $regex: '(?i).*abc.*' } },
                     { Data: { $regex: '(?i).*abc.*' } },
                     { Host: { $regex: '(?i).*abc.*' } },
                     { Path: { $regex: '(?i).*abc.*' } }
                  ]
               }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('page definition (first page)', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .page(0, 10)
         .toQuery();

      // then
      const expected = {
         limit: 10
      };
      expect(query).toEqual(expected);
   });

   it('page definition (subsequent page)', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .page(5, 10)
         .toQuery();

      // then
      const expected = {
         skip: 50,
         limit: 10
      };
      expect(query).toEqual(expected);
   });

   it('limit number of rows', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .numberOfRows(1)
         .toQuery();

      // then
      const expected = {
         limit: 1
      };
      expect(query).toEqual(expected);
   });
});
