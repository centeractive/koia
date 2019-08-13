import { Route } from '../route.enum';

export interface ConfigRecord {
   route: Route,
   name: string;
   modifiedTime: number;
   data: any;
}
