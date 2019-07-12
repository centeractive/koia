import { Query } from './query';

export interface Page {
   query: Query,
   entries: Object[];
   totalRowCount: number;
}
