import { Route } from '../route.enum';
import { QueryDef } from './query/query-def.type';
import { ViewElement } from './view-element.type';

export interface View {
   route: Route,
   name: string;
   modifiedTime: number;
   query: QueryDef,
   gridColumns: number;
   gridCellRatio: string;
   elements: ViewElement[];
}
