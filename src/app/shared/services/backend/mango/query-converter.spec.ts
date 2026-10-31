import { QueryConverter } from './query-converter';
import { Column, DataType, Query, PropertyFilter, Operator } from 'app/shared/model';
import { MangoQueryBuilder } from './mango-query-builder';
import { CouchDBConstants } from '../couchdb';

describe('QueryConverter', () => {

   it('should name table style fields', () => {
      expect(QueryConverter.TABLE_STYLE_FIELDS).toEqual([QueryConverter.FG_COLOR, QueryConverter.BG_COLOR]);
      expect(QueryConverter.TABLE_STYLE_FIELDS).toEqual(['fgcolor', 'bgcolor']);
   });

   let columns: Column[];
   let query: Query;
   const queryConverter = new QueryConverter(false);

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

   beforeEach(() => {
      query = new Query();
   });

   it('#queryForAllMatchingIds when query has no filter', () => {

      // when
      const mangoQuery = queryConverter.queryForAllMatchingIds(columns, query);

      // then
      const expected = {
         selector: {
            _id: { $gt: null }
         },
         fields: [CouchDBConstants._ID],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(mangoQuery).toEqual(expected);
   });

   it('#queryForAllMatchingIds when query has full text filter', () => {

      // given
      query.setFullTextFilter('abc');

      // when
      const mangoQuery = queryConverter.queryForAllMatchingIds(columns, query);

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
         fields: [CouchDBConstants._ID],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(mangoQuery).toEqual(expected);
   });

   it('#queryForAllMatchingIds when query has property filter', () => {

      // given
      query.addPropertyFilter(new PropertyFilter('x', Operator.EQUAL, 'abc'));

      // when
      const mangoQuery = queryConverter.queryForAllMatchingIds(columns, query);

      // then
      const expected = {
         selector: {
            x: { $eq: 'abc' }
         },
         fields: [CouchDBConstants._ID],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(mangoQuery).toEqual(expected);
   });

   it('#queryForAllMatchingIds when query has value range filter', () => {

      // given
      query.addValueRangeFilter('x', 1, 2);

      // when
      const mangoQuery = queryConverter.queryForAllMatchingIds(columns, query);

      // then
      const expected = {
         selector: {
            x: { $gte: 1, $lte: 2 }
         },
         fields: [CouchDBConstants._ID],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(mangoQuery).toEqual(expected);
   });

   it('#queryForAllMatchingIds when query has value range filter (max excluded)', () => {

      // given
      query.addValueRangeFilter('x', 1, 2, true);

      // when
      const mangoQuery = queryConverter.queryForAllMatchingIds(columns, query);

      // then
      const expected = {
         selector: {
            x: { $gte: 1, $lt: 2 }
         },
         fields: [CouchDBConstants._ID],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(mangoQuery).toEqual(expected);
   });

   it('#queryForAllMatchingIds when query has inverted value range filter', () => {

      // given
      query.addValueRangeFilter('x', 1, 2, false, true);

      // when
      const mangoQuery = queryConverter.queryForAllMatchingIds(columns, query);

      // then
      const expected = {
         selector: {
            $or: [
               { x: { $lt: 1 } },
               { x: { $gt: 2 } }
            ]
         },
         fields: [CouchDBConstants._ID],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(mangoQuery).toEqual(expected);
   });

   it('#queryForAllMatchingIds when query has inverted value range filter (max excluded)', () => {

      // given
      query.addValueRangeFilter('x', 1, 2, true, true);

      // when
      const mangoQuery = queryConverter.queryForAllMatchingIds(columns, query);

      // then
      const expected = {
         selector: {
            $or: [
               { x: { $lt: 1 } },
               { x: { $gte: 2 } }
            ]
         },
         fields: [CouchDBConstants._ID],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(mangoQuery).toEqual(expected);
   });

   it('#queryForAllMatchingIds when CouchDB query has sort', () => {

      // given
      query.setSort({ active: 'Level', direction: 'desc' });

      // when
      const mangoQuery = queryConverter.queryForAllMatchingIds(columns, query);

      // then
      const expected = {
         selector: {
            _id: { $gt: null }
         },
         fields: [CouchDBConstants._ID],
         sort: [
            { Level: 'desc' }
         ],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(mangoQuery).toEqual(expected);
   });

   it('#queryForAllMatchingIds when PouchDB query has sort', () => {

      // given
      query.setSort({ active: 'Level', direction: 'desc' });

      // when
      const mangoQuery = new QueryConverter(true).queryForAllMatchingIds(columns, query);

      // then
      const expected = {
         selector: {
            $and: [
               { _id: { $gt: null } },
               { Level: { $gte: null } }
            ]
         },
         fields: [CouchDBConstants._ID],
         sort: [
            { Level: 'desc' }
         ],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(mangoQuery).toEqual(expected);
   });

   it('#queryForAllMatchingIds when PouchDB query has inverted value range filter without min', () => {

      // given
      query.addValueRangeFilter('Amount', undefined, 5, false, true);

      // when
      const mangoQuery = new QueryConverter(true).queryForAllMatchingIds(columns, query);

      // then
      const expected = {
         selector: {
            Amount: { $gt: 5 }
         },
         fields: [CouchDBConstants._ID],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(mangoQuery).toEqual(expected);
   });

   it('#queryForAllMatchingIds when PouchDB query has value range filter without min', () => {

      // given
      query.addValueRangeFilter('Amount', undefined, 5);

      // when
      const mangoQuery = new QueryConverter(true).queryForAllMatchingIds(columns, query);

      // then
      const expected = {
         selector: {
            Amount: { $lte: 5, $exists: true }
         },
         fields: [CouchDBConstants._ID],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(mangoQuery).toEqual(expected);
   });

   it('#queryForAllMatchingIds when PouchDB query has EQUAL filters on same field', () => {

      // given
      query.addPropertyFilter(new PropertyFilter('Level', Operator.EQUAL, 'INFO'));
      query.addPropertyFilter(new PropertyFilter('Level', Operator.EQUAL, 'WARN'));

      // when
      const mangoQuery = new QueryConverter(true).queryForAllMatchingIds(columns, query);

      // then
      const expected = {
         selector: {
            $and: [
               { Level: { $eq: 'INFO' } },
               { $nor: [{ $nor: [{ Level: { $eq: 'WARN' } }] }] }
            ]
         },
         fields: [CouchDBConstants._ID],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(mangoQuery).toEqual(expected);
   });

   it('#toMango when query has no filter', () => {

      // when
      const mangoQuery = queryConverter.toMango(columns, query);

      // then
      const expected = {
         selector: {
            _id: { $gt: null }
         },
         fields: [CouchDBConstants._ID, 'ID', 'Time', 'Level', 'Data', 'Host', 'Path', 'Amount'],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(mangoQuery).toEqual(expected);
   });

   it('#toMango when query has full text filter', () => {

      // given
      query.setFullTextFilter('abc');

      // when
      const mangoQuery = queryConverter.toMango(columns, query);

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
         fields: [CouchDBConstants._ID, 'ID', 'Time', 'Level', 'Data', 'Host', 'Path', 'Amount'],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(mangoQuery).toEqual(expected);
   });

   it('#toMango should fetch field columns only but search all text columns', () => {

      // given
      query.setFullTextFilter('abc');
      const fieldColumns = columns.filter(c => c.name === 'ID' || c.name === 'Level');

      // when
      const mangoQuery = queryConverter.toMango(columns, query, fieldColumns);

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
         fields: [CouchDBConstants._ID, 'ID', 'Level'],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(mangoQuery).toEqual(expected);
   });

   it('#toMango should convert number filter value of column that is not fetched', () => {

      // given
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.GREATER_THAN, '5'));
      const fieldColumns = columns.filter(c => c.name === 'ID');

      // when
      const mangoQuery = queryConverter.toMango(columns, query, fieldColumns);

      // then
      const expected = {
         selector: {
            Amount: { $gt: 5 }
         },
         fields: [CouchDBConstants._ID, 'ID'],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(mangoQuery).toEqual(expected);
   });

   it('#toMango when query has property filter', () => {

      // given
      query.addPropertyFilter(new PropertyFilter('x', Operator.EQUAL, 'abc'));

      // when
      const mangoQuery = queryConverter.toMango(columns, query);

      // then
      const expected = {
         selector: {
            x: { $eq: 'abc' }
         },
         fields: [CouchDBConstants._ID, 'ID', 'Time', 'Level', 'Data', 'Host', 'Path', 'Amount'],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(mangoQuery).toEqual(expected);
   });

   it('#toMango when query has value range filter', () => {

      // given
      query.addValueRangeFilter('x', 1, 2);

      // when
      const mangoQuery = queryConverter.toMango(columns, query);

      // then
      const expected = {
         selector: {
            x: { $gte: 1, $lte: 2 }
         },
         fields: [CouchDBConstants._ID, 'ID', 'Time', 'Level', 'Data', 'Host', 'Path', 'Amount'],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(mangoQuery).toEqual(expected);
   });

   it('#toMango when query has value range filter (max excluded)', () => {

      // given
      query.addValueRangeFilter('x', 1, 2, true);

      // when
      const mangoQuery = queryConverter.toMango(columns, query);

      // then
      const expected = {
         selector: {
            x: { $gte: 1, $lt: 2 }
         },
         fields: [CouchDBConstants._ID, 'ID', 'Time', 'Level', 'Data', 'Host', 'Path', 'Amount'],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(mangoQuery).toEqual(expected);
   });

   it('#toMango when query has inverted value range filter', () => {

      // given
      query.addValueRangeFilter('x', 1, 2, false, true);

      // when
      const mangoQuery = queryConverter.toMango(columns, query);

      // then
      const expected = {
         selector: {
            $or: [
               { x: { $lt: 1 } },
               { x: { $gt: 2 } }
            ]
         },
         fields: [CouchDBConstants._ID, 'ID', 'Time', 'Level', 'Data', 'Host', 'Path', 'Amount'],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(mangoQuery).toEqual(expected);
   });

   it('#toMango when query has inverted value range filter (max excluded)', () => {

      // given
      query.addValueRangeFilter('x', 1, 2, true, true);

      // when
      const mangoQuery = queryConverter.toMango(columns, query);

      // then
      const expected = {
         selector: {
            $or: [
               { x: { $lt: 1 } },
               { x: { $gte: 2 } }
            ]
         },
         fields: [CouchDBConstants._ID, 'ID', 'Time', 'Level', 'Data', 'Host', 'Path', 'Amount'],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(mangoQuery).toEqual(expected);
   });

   it('#toMango when query has filters matching empty values', () => {

      // given
      query.addPropertyFilter(new PropertyFilter('Level', Operator.NONE_OF, 'DEBUG', DataType.TEXT, true));
      query.addValueRangeFilter('Amount', 1, 5, true, true, true);

      // when
      const mangoQuery = queryConverter.toMango(columns, query);

      // then
      const expected = {
         selector: {
            $and: [
               { $or: [{ Level: { $exists: false } }, { Level: { $nin: ['DEBUG'] } }] },
               { $or: [{ Amount: { $exists: false } }, { Amount: { $lt: 1 } }, { Amount: { $gte: 5 } }] }
            ]
         },
         fields: [CouchDBConstants._ID, 'ID', 'Time', 'Level', 'Data', 'Host', 'Path', 'Amount'],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(mangoQuery).toEqual(expected);
   });

   it('#toMango when CouchDB query has inverted value range filter without bounds and property filter', () => {

      // given
      query.addPropertyFilter(new PropertyFilter('Level', Operator.EQUAL, 'INFO'));
      query.addValueRangeFilter('Amount', undefined, undefined, false, true);

      // when
      const mangoQuery = queryConverter.toMango(columns, query);

      // then
      const expected = {
         selector: {
            $and: [
               { Level: { $eq: 'INFO' } },
               { Amount: { $in: [] } }
            ]
         },
         fields: [CouchDBConstants._ID, 'ID', 'Time', 'Level', 'Data', 'Host', 'Path', 'Amount'],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(mangoQuery).toEqual(expected);
   });

   it('#toMango when PouchDB query has NOT_EQUAL filter and sort on its column', () => {

      // given
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.NOT_EQUAL, '20', DataType.NUMBER));
      query.setSort({ active: 'Amount', direction: 'asc' });

      // when
      const mangoQuery = new QueryConverter(true).toMango(columns, query);

      // then
      const expected = {
         selector: {
            Amount: { $nin: [20] }
         },
         fields: [CouchDBConstants._ID, 'ID', 'Time', 'Level', 'Data', 'Host', 'Path', 'Amount'],
         sort: [{ Amount: 'asc' }],
         limit: MangoQueryBuilder.LIMIT
      };
      expect(mangoQuery).toEqual(expected);
   });

   it('#toMango when query page definition', () => {

      // given
      query.setPageDefinition(4, 10);
      query.addPropertyFilter(new PropertyFilter('x', Operator.EQUAL, 'abc'));

      // when
      const mangoQuery = queryConverter.toMango(columns, query);

      // then
      const expected = {
         selector: {
            x: { $eq: 'abc' }
         },
         fields: [CouchDBConstants._ID, 'ID', 'Time', 'Level', 'Data', 'Host', 'Path', 'Amount', 'fgcolor', 'bgcolor'],
         skip: 40,
         limit: 10
      };
      expect(mangoQuery).toEqual(expected);
   });
});
