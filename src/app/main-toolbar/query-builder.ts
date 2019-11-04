import { Query, PropertyFilter, Operator } from 'app/shared/model';
import { NumberRangeFilter } from './range-filter/model/number-range-filter';

export class QueryBuilder {

  private query = new Query();

  fullTextFilter(fullTextFilter: string): QueryBuilder {
    if (fullTextFilter && fullTextFilter.length > 0) {
      this.query.setFullTextFilter(fullTextFilter);
    }
    return this;
  }

  propertyFilters(propertyFilters: PropertyFilter[]): QueryBuilder {
    propertyFilters
      .filter(f => f.operator === Operator.EMPTY || f.operator === Operator.NOT_EMPTY
        || (f.value !== undefined && f.value !== ''))
      .forEach(f => this.query.addPropertyFilter(f.clone()));
    return this;
  }

  rangeFilters(rangeFilters: NumberRangeFilter[]): QueryBuilder {
    rangeFilters
      .filter(f => f.inverted || f.isStartFiltered() || f.isEndFiltered())
      .forEach(f => {
        const min = f.start === f.selValueRange.min ? undefined : f.selValueRange.min;
        const max = f.end === f.selValueRange.max ? undefined : f.selValueRange.max;
        this.query.addValueRangeFilter(f.column.name, min, max, f.selValueRange.maxExcluding, f.inverted);
      });
    return this;
  }

  getQuery(): Query {
    return this.query;
  }
}
