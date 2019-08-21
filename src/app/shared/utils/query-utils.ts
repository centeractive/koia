import { Query } from '../model/query';
import { ArrayUtils } from './array-utils';

export class QueryUtils {

   /**
    * @returns a new query that with no redundant filters
    */
   static sanitize(query: Query): Query {
      return query;
   }

   static areFiltersEqual(query: Query, otherQuery: Query): boolean {
      return query.getFullTextFilter() === otherQuery.getFullTextFilter() && //
         ArrayUtils.compareLoose(query.getPropertyFilters(), otherQuery.getPropertyFilters()) && //
         ArrayUtils.compareLoose(query.getValueRangeFilters(), otherQuery.getValueRangeFilters());
   }
}
