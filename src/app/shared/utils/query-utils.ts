import { Query } from '../model/query';
import { ArrayUtils } from './array-utils';

export class QueryUtils {

   static areFiltersEqual(query: Query, otherQuery: Query): boolean {
      return query.getFullTextFilter() === otherQuery.getFullTextFilter() && //
         ArrayUtils.compareLoose(query.getPropertyFilters(), otherQuery.getPropertyFilters()) && //
         ArrayUtils.compareLoose(query.getValueRangeFilters(), otherQuery.getValueRangeFilters());
   }
}
