import { Query, Route } from '../../model';
import { createConfigRecord } from './config-record-factory';
import { queryToQueryDef } from './filter/query-to-filter-converter';

describe('createConfigRecord', () => {

   it('should create record with converted query', () => {

      // given
      const query = new Query();
      query.setFullTextFilter('abc');
      const data = { a: 1 };

      // when
      const record = createConfigRecord(Route.PIVOT, 'test', query, data, 123);

      // then
      expect(record).toEqual({ route: Route.PIVOT, name: 'test', modifiedTime: 123, query: queryToQueryDef(query), data });
   });
});
