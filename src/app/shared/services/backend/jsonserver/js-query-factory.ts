import { Operator } from 'app/shared/model/operator.enum';
import { PropertyFilter } from 'app/shared/model/property-filter';
import { Query } from 'app/shared/model/query';

/**
 * Creates queries for requests sent to the jsonserver. The same queries are used internally in this web-application
 * when switching to a different component with pre-set filters.
 *
 * @see https://github.com/typicode/json-server
 */
export class JSQueryFactory {

   /**
    * @returns non-encoded and non-escaped query string
    */
   create(query: Query): string {
      let jsQuery = '';
      if (query.hasFullTextFilter()) {
         jsQuery = this.append(jsQuery, 'q', query.getFullTextFilter());
      }
      let propertyFilters = query.getPropertyFilters();
      query.getValueRangeFilters().forEach(f => propertyFilters = propertyFilters.concat(f.toPropertyFilters()));
      for (const propertyFilter of propertyFilters) {
         if (propertyFilter.isApplicable() && !this.isCoveredByOther(propertyFilter, propertyFilters)) {
            jsQuery = this.appendPropertyFilter(jsQuery, propertyFilter);
         }
      }
      if (query.getSort()) {
         jsQuery = this.append(jsQuery, '_sort', query.getSort().active);
         jsQuery = this.append(jsQuery, '_order', query.getSort().direction);
      }
      if (query.getPageIndex() >= 0 && query.getRowsPerPage() > 0) {
         jsQuery = this.append(jsQuery, '_page', query.getPageIndex() + 1);
         jsQuery = this.append(jsQuery, '_limit', query.getRowsPerPage());
      }
      return jsQuery;
   }

   /**
    * indicates if the specified property filter is covered by another property filter and may be considered to be redundant,
    * thus be omitted from the query string
    */
   private isCoveredByOther(propertyFilter: PropertyFilter, propertyFilters: PropertyFilter[]): boolean {
      if (propertyFilter.operator === Operator.NOT_EMPTY) {
         const coveringOperators = [Operator.CONTAINS, Operator.EQUAL, Operator.GREATER_THAN_OR_EQUAL, Operator.LESS_THAN_OR_EQUAL];
         return propertyFilters
            .filter(f => f !== propertyFilter)
            .filter(f => f.name === propertyFilter.name)
            .filter(f => f.isApplicable())
            .map(f => f.operator)
            .some(o => coveringOperators.includes(o));
      }
      return false;
   }

   private appendPropertyFilter(query: string, propertyFilter: PropertyFilter): string {
      const operator = propertyFilter.operator;
      let name = propertyFilter.name;
      if (operator === Operator.CONTAINS) {
         name += '_like';
      } else if (operator === Operator.NOT_EQUAL) {
         name += '_ne';
      } else if (operator === Operator.LESS_THAN) {
         name += '_lt';
      } else if (operator === Operator.LESS_THAN_OR_EQUAL) {
         name += '_lte';
      } else if (operator === Operator.GREATER_THAN_OR_EQUAL || operator === Operator.NOT_EMPTY) {
         name += '_gte';
      } else if (operator === Operator.GREATER_THAN) {
         name += '_gt';
      } else if (operator === Operator.ANY_OF) {
         name += '_like';
      } else if (operator === Operator.NONE_OF) {
         name += '_like';
      }
      return this.append(query, name, propertyFilter.value);
   }

   /**
    * TODO: values of [[Operator.ANY_OF]] and [[Operator.NONE_OF]] must be transformed into regex
    */
   private append(query: string, name: string, value: any): string {
      query += query.length === 0 ? '?' : '&';
      return query += name + '=' + value;
   }
}
