import { Query } from '../model/query';
import { ValueRangeFilter } from '../value-range/model';
import { PropertyFilter } from '../model';
import { CommonUtils } from './common-utils';
import { ValueRangeFilterMerger } from '../value-range';

export class QuerySanitizer {

   private valueRangeFilterMerger = new ValueRangeFilterMerger();

   constructor(private query: Query) { }

   /**
    * TODO: improve to cover more cases
    *
    * @returns a new query with no redundant or overlapping filters
    */
   sanitize(): Query {
      const newQuery = new Query();
      newQuery.setFullTextFilter(this.query.getFullTextFilter());
      this.cleanUpPropertyFilters(this.query).forEach(f => newQuery.addPropertyFilter(f));
      this.cleanUpValueRangeFilters(this.query).forEach(f =>
         newQuery.addValueRangeFilter(f.propertyName, f.valueRange.min, f.valueRange.max, f.valueRange.maxExcluding, f.inverted));
      return newQuery;
   }

   private cleanUpPropertyFilters(query: Query): PropertyFilter[] {
      const retainedFilters: PropertyFilter[] = [];
      query.getPropertyFilters().forEach(f => {
         if (retainedFilters.find(rf => CommonUtils.compare(f, rf)) === undefined) {
            retainedFilters.push(f);
         }
      });
      return retainedFilters;
   }

   private cleanUpValueRangeFilters(query: Query): ValueRangeFilter[] {
      const retainedFilters: ValueRangeFilter[] = [];
      for (const filter of query.getValueRangeFilters()) {
         const matchingFilters = retainedFilters.filter(rf => rf.propertyName === filter.propertyName);
         if (matchingFilters.length === 0 || !this.tryMerging(filter, matchingFilters)) {
            retainedFilters.push(filter);
         }
      }
      return retainedFilters;
   }

   private tryMerging(filter: ValueRangeFilter, matchingFilters: ValueRangeFilter[]): boolean {
      for (const matchingFilter of matchingFilters) {
         if (this.valueRangeFilterMerger.merge(matchingFilter, filter)) {
            return true;
         }
      };
      return false;
   }
}
