import { Query } from '../model';

export class QueryFilter {

   constructor(private query: Query) { }

   filter(row: Object): boolean {
      if (this.query.getFullTextFilter()) {
         return true;
      }
      return row['Data'].includes(this.query.getFullTextFilter());
   }
}
