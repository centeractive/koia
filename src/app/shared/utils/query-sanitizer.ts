import { Query } from '../model/query';
import { ValueRangeFilter } from '../value-range/model';
import { Operator, PropertyFilter } from '../model';
import { CommonUtils } from './common-utils';
import { ValueRangeFilterMerger, ValueRangeFilterSorter } from '../value-range';

export class QuerySanitizer {

   private static readonly DATA_TYPE_DEPENDENT_OPERATORS = [Operator.ANY_OF, Operator.NONE_OF];

   private valueRangeFilterSorter = new ValueRangeFilterSorter();
   private valueRangeFilterMerger = new ValueRangeFilterMerger();

   constructor(private query: Query) { }

   /**
    * @returns a new query with no redundant or overlapping filters
    */
   sanitize(): Query {
      const newQuery = new Query();
      if (this.query.getFullTextFilter()) {
         newQuery.setFullTextFilter(this.query.getFullTextFilter());
      }
      this.cleanUpPropertyFilters(this.query).forEach(f => newQuery.addPropertyFilter(f));
      this.cleanUpValueRangeFilters(this.query).forEach(f =>
         newQuery.addValueRangeFilter(f.name, f.valueRange.min, f.valueRange.max, f.valueRange.maxExcluding, f.inverted));
      return newQuery;
   }

   private cleanUpPropertyFilters(query: Query): PropertyFilter[] {
      const retainedFilters: PropertyFilter[] = [];
      query.getPropertyFilters().forEach(f => {
         const index = retainedFilters.findIndex(rf => this.isSameCondition(f, rf));
         if (index === -1) {
            retainedFilters.push(f);
         } else if (retainedFilters[index].dataType === undefined) {
            retainedFilters[index] = f;
         }
      });
      return retainedFilters;
   }

   private isSameCondition(f1: PropertyFilter, f2: PropertyFilter): boolean {
      return f1.name === f2.name && f1.operator === f2.operator && f1.value === f2.value &&
         (f1.dataType === f2.dataType || this.isDataTypeNegligible(f1, f2));
   }

   private isDataTypeNegligible(f1: PropertyFilter, f2: PropertyFilter): boolean {
      return !QuerySanitizer.DATA_TYPE_DEPENDENT_OPERATORS.includes(f1.operator) &&
         (f1.dataType === undefined || f2.dataType === undefined);
   }

   private cleanUpValueRangeFilters(query: Query): ValueRangeFilter[] {
      const retainedFilters: ValueRangeFilter[] = [];
      for (const filter of this.valueRangeFilterSorter.sort(query.getValueRangeFilters())) {
         const matchingFilters = retainedFilters.filter(rf => rf.name === filter.name);
         if (matchingFilters.some(rf => CommonUtils.compare(rf, filter))) {
            continue;
         }
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
      }
      return false;
   }
}
