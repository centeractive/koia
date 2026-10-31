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

   function abcFullTextSelector(regex: RegExp | string): object {
      return { $or: ['Level', 'Data', 'Host', 'Path'].map(name => ({ [name]: { $regex: regex } })) };
   }

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
         selector: abcFullTextSelector('(?i).*abc.*'),
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
         selector: abcFullTextSelector(/.*abc.*/i),
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
         selector: abcFullTextSelector('(?i).*a\\(b.*'),
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
         selector: abcFullTextSelector(/.*a\(b.*/i),
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

   it('NONE_OF and NOT_EQUAL filters matching empty values exclude values by single $nor for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('Level', Operator.NONE_OF, 'DEBUG;INFO', DataType.TEXT, true)
         .where('Level', Operator.NOT_EQUAL, 'a;b', DataType.TEXT, true)
         .where('Amount', Operator.NOT_EQUAL, 1234.5, DataType.NUMBER, true)
         .where('Amount', Operator.NOT_EQUAL, 1e-7, DataType.NUMBER, true)
         .toQuery();

      // then
      const expected = {
         selector: {
            $nor: [
               { Level: { $in: ['DEBUG', 'INFO'] } },
               { Level: { $eq: 'a;b' } },
               { Amount: { $eq: 1234.5 } },
               { Amount: { $eq: 1e-7 } }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('inverted ranges matching empty values exclude ranges by same $nor for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .whereRangeInverted(new ValueRangeFilter('Time', { min: 1, max: 5, maxExcluding: true }, true, true))
         .whereRangeInverted(new ValueRangeFilter('Amount', { min: undefined, max: 7 }, true, true))
         .toQuery();

      // then
      const expected = {
         selector: {
            $nor: [
               { Time: { $gte: 1, $lt: 5 } },
               { Amount: { $lte: 7 } }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('unbounded inverted range matching empty values excludes all values for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .whereRangeInverted(new ValueRangeFilter('ID', { min: undefined, max: undefined }, true, true))
         .toQuery();

      // then
      const expected = {
         selector: {
            $nor: [{ ID: { $exists: true } }]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('filters matching empty values combine with other filters for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('Level', Operator.EQUAL, 'ERROR', DataType.TEXT)
         .where('Host', Operator.NONE_OF, 'h1', DataType.TEXT, true)
         .whereRangeInverted(new ValueRangeFilter('Amount', { min: 1, max: 2 }, true))
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { Level: { $eq: 'ERROR' } },
               { $nor: [{ Host: { $in: ['h1'] } }, { Amount: { $exists: false } }, { Amount: { $gte: 1, $lte: 2 } }] }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('NONE_OF and NOT_EQUAL filters matching empty values keep rows lacking the field by $or per filter for CouchDB', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .where('Level', Operator.NONE_OF, 'DEBUG;INFO', DataType.TEXT, true)
         .where('Level', Operator.NOT_EQUAL, 'a;b', DataType.TEXT, true)
         .where('Amount', Operator.NOT_EQUAL, 1234.5, DataType.NUMBER, true)
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { $or: [{ Level: { $exists: false } }, { Level: { $nin: ['DEBUG', 'INFO'] } }] },
               { $or: [{ Level: { $exists: false } }, { Level: { $ne: 'a;b' } }] },
               { $or: [{ Amount: { $exists: false } }, { Amount: { $ne: 1234.5 } }] }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('inverted ranges matching empty values keep rows lacking the field by $or per filter for CouchDB', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .whereRangeInverted(new ValueRangeFilter('Time', { min: 1, max: 5, maxExcluding: true }, true, true))
         .whereRangeInverted(new ValueRangeFilter('Amount', { min: undefined, max: 7 }, true, true))
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { $or: [{ Time: { $exists: false } }, { Time: { $lt: 1 } }, { Time: { $gte: 5 } }] },
               { $or: [{ Amount: { $exists: false } }, { Amount: { $gt: 7 } }] }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('unbounded inverted range matching empty values keeps only rows lacking the field for CouchDB', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .whereRangeInverted(new ValueRangeFilter('ID', { min: undefined, max: undefined }, true, true))
         .toQuery();

      // then
      const expected = {
         selector: {
            $or: [{ ID: { $exists: false } }]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('NOT_EMPTY selector for CouchDB', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .where('Level', Operator.NOT_EMPTY, '')
         .toQuery();

      // then
      const expected = {
         selector: {
            Level: { $gt: null }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('NOT_EMPTY selector for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('Level', Operator.NOT_EMPTY, '')
         .toQuery();

      // then
      const expected = {
         selector: {
            Level: { $exists: true }
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
            a: { $nin: ['b'], $regex: /.*x.*/i }
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
               abcFullTextSelector(/.*abc.*/i),
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
            'x': { '$exists': true }
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

   it('sort column filtered only by filter matching empty values for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('x', Operator.NONE_OF, 'a', DataType.TEXT, true)
         .sortBy({ active: 'x', direction: 'asc' })
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { $nor: [{ x: { $in: ['a'] } }] },
               { x: { $gte: null } }
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
               abcFullTextSelector('(?i).*abc.*')
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('inverted ranges with two bounds not matching empty values exclude their values and rows lacking the field by single $nor for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .whereRangeInverted(new ValueRangeFilter('Amount', { min: 5, max: 10, maxExcluding: true }, true))
         .whereRangeInverted(new ValueRangeFilter('Amount', { min: 20, max: 25, maxExcluding: true }, true))
         .whereRangeInverted(new ValueRangeFilter('Time', { min: 1, max: 3 }, true))
         .toQuery();

      // then
      const expected = {
         selector: {
            $nor: [
               { Amount: { $exists: false } },
               { Time: { $exists: false } },
               { Amount: { $gte: 5, $lt: 10 } },
               { Amount: { $gte: 20, $lt: 25 } },
               { Time: { $gte: 1, $lte: 3 } }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('unbounded inverted range not matching empty values matches no row for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .whereRangeInverted(new ValueRangeFilter('ID', { min: undefined, max: undefined }, true))
         .toQuery();

      // then
      const expected = {
         selector: {
            $nor: [{ ID: { $exists: false } }, { ID: { $exists: true } }]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('inverted ranges with two bounds matching and not matching empty values on same field share $nor for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .whereRangeInverted(new ValueRangeFilter('Amount', { min: 5, max: 10, maxExcluding: true }, true, true))
         .whereRangeInverted(new ValueRangeFilter('Amount', { min: 20, max: 25, maxExcluding: true }, true))
         .toQuery();

      // then
      const expected = {
         selector: {
            $nor: [
               { Amount: { $exists: false } },
               { Amount: { $gte: 5, $lt: 10 } },
               { Amount: { $gte: 20, $lt: 25 } }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('EMPTY filter on field of inverted range with two bounds keeps its $exists apart from $nor for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('Amount', Operator.EMPTY, '')
         .whereRangeInverted(new ValueRangeFilter('Amount', { min: 5, max: 10 }, true))
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { Amount: { $exists: false } },
               { $nor: [{ Amount: { $exists: false } }, { Amount: { $gte: 5, $lte: 10 } }] }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('inverted range without min becomes $gt filter beside property filter on same field, full text filter and sort for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .whereAnyText('abc')
         .where('Amount', Operator.GREATER_THAN, '1', DataType.NUMBER)
         .whereRangeInverted(new ValueRangeFilter('Amount', { min: undefined, max: 7 }, true))
         .sortBy({ active: 'Amount', direction: 'desc' })
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { Amount: { $gt: 1 } },
               { Amount: { $gt: 7 } },
               abcFullTextSelector(/.*abc.*/i)
            ]
         },
         sort: [{ Amount: 'desc' }],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('sort column filtered only by inverted range with two bounds for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .whereRangeInverted(new ValueRangeFilter('Amount', { min: 5, max: 10 }, true))
         .sortBy({ active: 'Amount', direction: 'asc' })
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { $nor: [{ Amount: { $exists: false } }, { Amount: { $gte: 5, $lte: 10 } }] },
               { Amount: { $gte: null } }
            ]
         },
         sort: [{ Amount: 'asc' }],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('inverted ranges on same field keep an $or per range for CouchDB', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .whereRangeInverted(new ValueRangeFilter('Amount', { min: 5, max: 10, maxExcluding: true }, true))
         .whereRangeInverted(new ValueRangeFilter('Amount', { min: 20, max: 25, maxExcluding: true }, true))
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { $or: [{ Amount: { $lt: 5 } }, { Amount: { $gte: 10 } }] },
               { $or: [{ Amount: { $lt: 20 } }, { Amount: { $gte: 25 } }] }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('inverted range without min becomes $gt filter for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .whereRangeInverted(new ValueRangeFilter('Amount', { min: undefined, max: 20 }, true))
         .toQuery();

      // then
      const expected = {
         selector: {
            Amount: { $gt: 20 }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('inverted range without min and with excluded max becomes $gte filter for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .whereRangeInverted(new ValueRangeFilter('Amount', { min: undefined, max: 20, maxExcluding: true }, true))
         .toQuery();

      // then
      const expected = {
         selector: {
            Amount: { $gte: 20 }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('inverted range without max becomes LESS_THAN filter requiring field for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .whereRangeInverted(new ValueRangeFilter('Amount', { min: 20, max: undefined }, true))
         .toQuery();

      // then
      const expected = {
         selector: {
            Amount: { $lt: 20, $exists: true }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('inverted range without max and EMPTY filter on same field share selector matching no row for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('Amount', Operator.EMPTY, '', DataType.NUMBER)
         .whereRangeInverted(new ValueRangeFilter('Amount', { min: 20, max: undefined }, true))
         .toQuery();

      // then
      const expected = {
         selector: {
            Amount: { $exists: false, $lt: 20 }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('inverted ranges without min and without max on same field share selector for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .whereRangeInverted(new ValueRangeFilter('Amount', { min: undefined, max: 15 }, true))
         .whereRangeInverted(new ValueRangeFilter('Amount', { min: 45, max: undefined }, true))
         .toQuery();

      // then
      const expected = {
         selector: {
            Amount: { $gt: 15, $lt: 45 }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('inverted ranges without max on same field get separate selectors for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .whereRangeInverted(new ValueRangeFilter('Amount', { min: 30, max: undefined }, true))
         .whereRangeInverted(new ValueRangeFilter('Amount', { min: 45, max: undefined }, true))
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { Amount: { $lt: 30, $exists: true } },
               { Amount: { $lt: 45 } }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('inverted range without max and LESS_THAN_OR_EQUAL filter on same field get separate selectors for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('Amount', Operator.LESS_THAN_OR_EQUAL, 20, DataType.NUMBER)
         .whereRangeInverted(new ValueRangeFilter('Amount', { min: 20, max: undefined }, true))
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { Amount: { $lte: 20, $exists: true } },
               { Amount: { $lt: 20 } }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('inverted range without min and GREATER_THAN_OR_EQUAL filter on same field get separate selectors for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('Amount', Operator.GREATER_THAN_OR_EQUAL, 30, DataType.NUMBER)
         .whereRangeInverted(new ValueRangeFilter('Amount', { min: undefined, max: 30 }, true))
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { Amount: { $gte: 30 } },
               { Amount: { $gt: 30 } }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('sort column filtered by inverted range without min for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .whereRangeInverted(new ValueRangeFilter('Amount', { min: undefined, max: 20 }, true))
         .sortBy({ active: 'Amount', direction: 'asc' })
         .toQuery();

      // then
      const expected = {
         selector: {
            Amount: { $gt: 20 }
         },
         sort: [{ Amount: 'asc' }],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('inverted range without max matching empty values stays in $nor beside inverted range without min on same field for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .whereRangeInverted(new ValueRangeFilter('Amount', { min: 20, max: undefined }, true, true))
         .whereRangeInverted(new ValueRangeFilter('Amount', { min: undefined, max: 5 }, true))
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { Amount: { $gt: 5 } },
               { $nor: [{ Amount: { $gte: 20 } }] }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('LESS_THAN filter also requires the field for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('Amount', Operator.LESS_THAN, 30, DataType.NUMBER)
         .toQuery();

      // then
      const expected = {
         selector: {
            Amount: { $lt: 30, $exists: true }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('LESS_THAN_OR_EQUAL filter of range without min also requires the field for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('Amount', Operator.LESS_THAN_OR_EQUAL, 20)
         .toQuery();

      // then
      const expected = {
         selector: {
            Amount: { $lte: 20, $exists: true }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('LESS_THAN filter with lower bound on same field does not require the field for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('Amount', Operator.GREATER_THAN_OR_EQUAL, -5)
         .where('Amount', Operator.LESS_THAN, 30)
         .toQuery();

      // then
      const expected = {
         selector: {
            Amount: { $gte: -5, $lt: 30 }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('LESS_THAN filter with EMPTY filter on same field keeps $exists of EMPTY filter for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('Amount', Operator.EMPTY, '')
         .where('Amount', Operator.LESS_THAN, 30)
         .toQuery();

      // then
      const expected = {
         selector: {
            Amount: { $exists: false, $lt: 30 }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('LESS_THAN filter with NOT_EMPTY filter on same field gets single $exists for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('Amount', Operator.LESS_THAN, 30)
         .where('Amount', Operator.NOT_EMPTY, '')
         .toQuery();

      // then
      const expected = {
         selector: {
            Amount: { $lt: 30, $exists: true }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('LESS_THAN and LESS_THAN_OR_EQUAL filters on same field get separate selectors for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('Amount', Operator.LESS_THAN, 30)
         .where('Amount', Operator.LESS_THAN_OR_EQUAL, 20)
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { Amount: { $lt: 30, $exists: true } },
               { Amount: { $lte: 20 } }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('GREATER_THAN and GREATER_THAN_OR_EQUAL filters on same field get separate selectors for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('Amount', Operator.GREATER_THAN, 10)
         .where('Amount', Operator.GREATER_THAN_OR_EQUAL, 20)
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { Amount: { $gt: 10 } },
               { Amount: { $gte: 20 } }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('LESS_THAN and LESS_THAN_OR_EQUAL filters on same field share selector for CouchDB', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .where('Amount', Operator.LESS_THAN, 30)
         .where('Amount', Operator.LESS_THAN_OR_EQUAL, 20)
         .toQuery();

      // then
      const expected = {
         selector: {
            Amount: { $lt: 30, $lte: 20 }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('filters with same operator keep zero value in separate selectors', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .where('Amount', Operator.LESS_THAN, 0)
         .where('Amount', Operator.LESS_THAN, 5)
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { Amount: { $lt: 0 } },
               { Amount: { $lt: 5 } }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('LESS_THAN filter combines with other filters, filter matching empty values, full text filter and sort by other column for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .whereAnyText('abc')
         .where('Level', Operator.EQUAL, 'ERROR')
         .where('Amount', Operator.LESS_THAN, 30)
         .where('Amount', Operator.NOT_EQUAL, 10, DataType.NUMBER, true)
         .sortBy({ active: 'ID', direction: 'desc' })
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { Level: { $eq: 'ERROR' } },
               { Amount: { $lt: 30, $exists: true } },
               { $nor: [{ Amount: { $eq: 10 } }] },
               abcFullTextSelector(/.*abc.*/i),
               { ID: { $gte: null } }
            ]
         },
         sort: [{ ID: 'desc' }],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('sort column filtered by LESS_THAN filter for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('Amount', Operator.LESS_THAN, 30)
         .sortBy({ active: 'Amount', direction: 'asc' })
         .toQuery();

      // then
      const expected = {
         selector: {
            Amount: { $lt: 30, $exists: true }
         },
         sort: [{ Amount: 'asc' }],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('unbounded inverted range not matching empty values matches no row by empty $in for CouchDB', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .whereRangeInverted(new ValueRangeFilter('ID', { min: undefined, max: undefined }, true))
         .toQuery();

      // then
      const expected = {
         selector: {
            ID: { $in: [] }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('unbounded inverted range not matching empty values combines with other filters by empty $in for CouchDB', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .whereAnyText('abc')
         .where('Level', Operator.EQUAL, 'INFO')
         .whereRangeInverted(new ValueRangeFilter('Amount', { min: undefined, max: undefined }, true))
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { Level: { $eq: 'INFO' } },
               { Amount: { $in: [] } },
               abcFullTextSelector('(?i).*abc.*')
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('EMPTY and NOT_EMPTY filters on same field match no row by $exists in $nor for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('Amount', Operator.EMPTY, '')
         .where('Amount', Operator.NOT_EMPTY, '')
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { Amount: { $exists: false } },
               { $nor: [{ Amount: { $exists: false } }] }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('NOT_EMPTY and EMPTY filters on same field match no row by $exists in $nor for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('Amount', Operator.NOT_EMPTY, '')
         .where('Amount', Operator.EMPTY, '')
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { Amount: { $exists: false } },
               { $nor: [{ Amount: { $exists: false } }] }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('NOT_EMPTY filter contradicting EMPTY filter shares $exists of inverted range in $nor for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('Amount', Operator.EMPTY, '')
         .where('Amount', Operator.NOT_EMPTY, '')
         .whereRangeInverted(new ValueRangeFilter('Amount', { min: 5, max: 10 }, true))
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { Amount: { $exists: false } },
               { $nor: [{ Amount: { $exists: false } }, { Amount: { $gte: 5, $lte: 10 } }] }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('NOT_EMPTY filter keeps $exists when EMPTY filter is on other field for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('Level', Operator.NOT_EMPTY, '')
         .where('Amount', Operator.EMPTY, '')
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { Level: { $exists: true } },
               { Amount: { $exists: false } }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('sort column filtered by EMPTY and NOT_EMPTY filters for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('Amount', Operator.EMPTY, '')
         .where('Amount', Operator.NOT_EMPTY, '')
         .sortBy({ active: 'Amount', direction: 'asc' })
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { Amount: { $exists: false } },
               { $nor: [{ Amount: { $exists: false } }] }
            ]
         },
         sort: [{ Amount: 'asc' }],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('EMPTY and NOT_EMPTY filters on same field share selector for CouchDB', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .where('Amount', Operator.EMPTY, '')
         .where('Amount', Operator.NOT_EMPTY, '')
         .toQuery();

      // then
      const expected = {
         selector: {
            Amount: { $exists: false, $gt: null }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('EQUAL filters on same field keep second one double negated in $nor for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('Level', Operator.EQUAL, 'INFO')
         .where('Level', Operator.EQUAL, 'WARN')
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { Level: { $eq: 'INFO' } },
               { $nor: [{ $nor: [{ Level: { $eq: 'WARN' } }] }] }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('ANY_OF filters on same field keep second one double negated in $nor for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('Level', Operator.ANY_OF, 'INFO;WARN', DataType.TEXT)
         .where('Level', Operator.ANY_OF, 'WARN;ERROR', DataType.TEXT)
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { Level: { $in: ['INFO', 'WARN'] } },
               { $nor: [{ $nor: [{ Level: { $in: ['WARN', 'ERROR'] } }] }] }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('NONE_OF filters on same field keep second one double negated in $nor for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('Level', Operator.NONE_OF, 'INFO')
         .where('Level', Operator.NONE_OF, 'WARN')
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { Level: { $nin: ['INFO'] } },
               { $nor: [{ $nor: [{ Level: { $nin: ['WARN'] } }] }] }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('EMPTY filters on same field keep second one double negated in $nor for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('Amount', Operator.EMPTY, '')
         .where('Amount', Operator.EMPTY, '')
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { Amount: { $exists: false } },
               { $nor: [{ $nor: [{ Amount: { $exists: false } }] }] }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('bounds after EQUAL filter on same field are double negated in $nor without requiring field for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('Amount', Operator.EQUAL, '10', DataType.NUMBER)
         .where('Amount', Operator.GREATER_THAN_OR_EQUAL, 20)
         .where('Amount', Operator.LESS_THAN_OR_EQUAL, 40)
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { Amount: { $eq: 10 } },
               { $nor: [{ $nor: [{ Amount: { $gte: 20 } }] }, { $nor: [{ Amount: { $lte: 40 } }] }] }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('EQUAL filter after LESS_THAN filter on same field is double negated in $nor beside required field for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('Amount', Operator.LESS_THAN, 30)
         .where('Amount', Operator.EQUAL, 10)
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { Amount: { $exists: true, $lt: 30 } },
               { $nor: [{ $nor: [{ Amount: { $eq: 10 } }] }] }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('NOT_EQUAL filters become $nin of their single value for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('Level', Operator.NOT_EQUAL, 'a;b', DataType.TEXT)
         .where('Amount', Operator.NOT_EQUAL, '10', DataType.NUMBER)
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { Level: { $nin: ['a;b'] } },
               { Amount: { $nin: [10] } }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('NOT_EQUAL filters on same field keep second one double negated in $nor for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('Level', Operator.NOT_EQUAL, 'INFO')
         .where('Level', Operator.NOT_EQUAL, 'WARN')
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { Level: { $nin: ['INFO'] } },
               { $nor: [{ $nor: [{ Level: { $nin: ['WARN'] } }] }] }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('double negated filter shares $nor with filter matching empty values and inverted range beside full text filter and sort for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .whereAnyText('abc')
         .where('Amount', Operator.EQUAL, 10)
         .where('Amount', Operator.EQUAL, 20)
         .where('Level', Operator.NOT_EQUAL, 'INFO', DataType.TEXT, true)
         .whereRangeInverted(new ValueRangeFilter('Amount', { min: 5, max: 10 }, true))
         .sortBy({ active: 'Amount', direction: 'desc' })
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { Amount: { $eq: 10 } },
               {
                  $nor: [
                     { Level: { $eq: 'INFO' } },
                     { Amount: { $exists: false } },
                     { Amount: { $gte: 5, $lte: 10 } },
                     { $nor: [{ Amount: { $eq: 20 } }] }
                  ]
               },
               abcFullTextSelector(/.*abc.*/i)
            ]
         },
         sort: [{ Amount: 'desc' }],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('bound follows other operator on same field in selector for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('Amount', Operator.GREATER_THAN, 20)
         .where('Amount', Operator.ANY_OF, '30;50', DataType.NUMBER)
         .toQuery();

      // then
      const expected = {
         selector: {
            Amount: { $in: [30, 50], $gt: 20 }
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
      expect(Object.keys(query['selector']['Amount'])).toEqual(['$in', '$gt']);
   });

   it('NOT_EMPTY filter precedes bound of first selector on same field for PouchDB', () => {

      // when
      const query = new MangoQueryBuilder(true, columns)
         .where('Amount', Operator.GREATER_THAN, 30)
         .where('Amount', Operator.GREATER_THAN_OR_EQUAL, 20)
         .where('Amount', Operator.NOT_EMPTY, '')
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { Amount: { $exists: true, $gt: 30 } },
               { Amount: { $gte: 20 } }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
      expect(Object.keys(query['selector']['$and'][0]['Amount'])).toEqual(['$exists', '$gt']);
   });

   it('EQUAL filters, bounds and ANY_OF filter on same field keep their selectors for CouchDB', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .where('Amount', Operator.EQUAL, 10)
         .where('Amount', Operator.EQUAL, 30)
         .where('Amount', Operator.GREATER_THAN_OR_EQUAL, 20)
         .where('Amount', Operator.GREATER_THAN, 20)
         .where('Amount', Operator.ANY_OF, '30;50', DataType.NUMBER)
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { Amount: { $eq: 10, $gte: 20, $gt: 20, $in: [30, 50] } },
               { Amount: { $eq: 30 } }
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
