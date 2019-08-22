import { Query } from '../model/query';
import { ValueRangeFilter } from '../value-range/model';
import { PropertyFilter } from '../model';

export class QuerySanitizer {

   constructor(private query: Query) {}

   /**
    * TODO: improve to cover more cases
    *
    * @returns a new query with no redundant or overlapping filters
    */
   sanitize(): Query {
      const newQuery = new Query();
      newQuery.setFullTextFilter(this.query.getFullTextFilter());
      this.cleandUpPropertyFilters(this.query).forEach(f => newQuery.addPropertyFilter(f));
      this.cleandUpValueRangeFilters(this.query)
         .forEach(f => newQuery.addValueRangeFilter(f.propertyName, f.valueRange.min, f.valueRange.max));
      return newQuery;
   }

   private cleandUpPropertyFilters(query: Query): PropertyFilter[] {
      const retainedFilters: PropertyFilter[] = [];
      query.getPropertyFilters().forEach(f => {
         if (retainedFilters
            .filter(rf => rf.propertyName === f.propertyName)
            .filter(rf => rf.operator === f.operator)
            .filter(rf => rf.filterValue === f.filterValue)
            .length === 0) {
               retainedFilters.push(f);
            }
      });
      return retainedFilters;
   }

   private cleandUpValueRangeFilters(query: Query): ValueRangeFilter[] {
      const retainedFilters: ValueRangeFilter[] = [];
      query.getValueRangeFilters().forEach(f => {
         const retainedFilter = retainedFilters.find(rf => rf.propertyName === f.propertyName);
         if (retainedFilter) {
            const valueRange = retainedFilter.valueRange;
            valueRange.min = this.max(valueRange.min, f.valueRange.min);
            valueRange.max = this.min(valueRange.max, f.valueRange.max);
         } else {
            retainedFilters.push(f.clone());
         }
      });
      return retainedFilters;
   }

   private min(n1: number, n2: number): number | undefined {
      if (n1 === undefined || n1 === null) {
         return n2;
      } else if (n2 === undefined || n2 === null) {
         return n1;
      }
      return Math.min(n1, n2);
   }

   private max(n1: number, n2: number): number | undefined {
      if (n1 === undefined || n1 === null) {
         return n2;
      } else if (n2 === undefined || n2 === null) {
         return n1;
      }
      return Math.max(n1, n2);
   }
}
