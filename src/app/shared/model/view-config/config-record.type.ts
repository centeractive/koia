import { Route } from '../route.enum';
import { QueryDef } from './query/query-def.type';

export interface ConfigRecord {
   route: Route,
   name: string;
   modifiedTime: number;
   query: QueryDef;
   data: any;
}
