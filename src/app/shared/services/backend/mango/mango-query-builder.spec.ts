import { MangoQueryBuilder, CombineOperator } from './mango-query-builder';
import { Operator, Column, DataType, PropertyFilter } from 'app/shared/model';

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

   it('simple $eq selector', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .where('a', Operator.EQUAL, 'b')
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { a: { $eq: 'b' } }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('simple $in selector of text values', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .where('a', Operator.ANY_OF, 'a, b, c', DataType.TEXT)
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { a: { $in: ['a', 'b', 'c'] } }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('simple $in selector of number values', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .where('a', Operator.ANY_OF, '1, 2, 3', DataType.NUMBER)
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { a: { $in: [1, 2, 3] } }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('simple $in selector of time values', () => {

      // given
      const now = new Date().getTime();
      const a_minute_ago = now - 60_000;

      // when
      const query = new MangoQueryBuilder(false, columns)
         .where('a', Operator.ANY_OF, a_minute_ago + ', ' + now, DataType.TIME)
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { a: { $in: [a_minute_ago, now] } }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('simple $in selector of boolean values', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .where('a', Operator.ANY_OF, 'yes, no, yes', DataType.BOOLEAN)
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { a: { $in: [true, false, true] } }
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
            $and: [
               { a: { $gt: 10, $lt: 20 } }
            ]
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
            $and: [
               { a: { $regex: /.*x.*/i } }
            ]
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
            $and: [
               { a: { $regex: /(?=.*x.*)(?=.*y.*)(?=.*z.*)/i } }
            ]
         },
         limit: MangoQueryBuilder.LIMIT
      };
      expect(query).toEqual(expected);
   });

   it('OR selector', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .combineWhereWith(CombineOperator.OR)
         .where('a', Operator.EQUAL, 'b')
         .where('b', Operator.NOT_EMPTY, '')
         .toQuery();

      // then
      const expected = {
         selector: {
            $or: [
               { a: { $eq: 'b' } },
               { b: { $gt: null } }
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
   })

   it('selector & sort ascending for CouchDB', () => {

      // when
      const query = new MangoQueryBuilder(false, columns)
         .where('a', Operator.GREATER_THAN_OR_EQUAL, '7')
         .sortBy({ active: 'y', direction: 'asc' })
         .toQuery();

      // then
      const expected = {
         selector: {
            $and: [
               { a: { $gte: '7' } }
            ]
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
            $and: [
               { a: { $ne: 'b' } }
            ]
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
            '$and': [
               { 'x': { '$gt': null } }
            ]
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
});
