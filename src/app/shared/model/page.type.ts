import { Query } from './query';

export interface Page {
   query: Query,
   entries: object[];
   totalRowCount: number;
}
