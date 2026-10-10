import { Query, Route } from '../../model';
import { ConfigRecord } from '../../model/view-config';
import { queryToQueryDef } from './filter/query-to-filter-converter';

export function createConfigRecord(route: Route, name: string, query: Query, data: ConfigRecord['data'], modifiedTime: number): ConfigRecord {
   return {
      route,
      name,
      modifiedTime,
      query: queryToQueryDef(query),
      data
   };
}
