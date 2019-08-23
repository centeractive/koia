import { Query, Operator, PropertyFilter } from '../model';
import { QuerySanitizer } from './query-sanitizer';
import { ValueRangeFilter } from '../value-range/model';

describe('QuerySanitizer', () => {

  it('#sanitize should return query with unified property filter', () => {

    // given
    const query = new Query();
    query.addPropertyFilter(new PropertyFilter('X', Operator.EQUAL, 'a'));
    query.addPropertyFilter(new PropertyFilter('X', Operator.EQUAL, 'a'));

    // when
    const actualQuery = new QuerySanitizer(query).sanitize();

    // then
    const expPropertyFilter = new PropertyFilter('X', Operator.EQUAL, 'a');
    expect(actualQuery.getPropertyFilters()).toEqual([expPropertyFilter]);
  });

  it('#sanitize should return query with merged value range filter (excluding max)', () => {

    // given
    const query = new Query();
    query.addValueRangeFilter('X', undefined, undefined);
    query.addValueRangeFilter('X', 5, 12);
    query.addValueRangeFilter('X', undefined, 10);
    query.addValueRangeFilter('X', 3, undefined);

    // when
    const actualQuery = new QuerySanitizer(query).sanitize();

    // then
    const expValueRangeFilter = new ValueRangeFilter('X', { min: 5, max: 10, maxExcluding: undefined });
    expect(actualQuery.getValueRangeFilters()).toEqual([expValueRangeFilter]);
  });

  it('#sanitize should return query with merged value range filter (excluding max)', () => {

    // given
    const query = new Query();
    query.addValueRangeFilter('X', undefined, undefined);
    query.addValueRangeFilter('X', 5, 12);
    query.addValueRangeFilter('X', undefined, 10);
    query.addValueRangeFilter('X', undefined, 10, true);
    query.addValueRangeFilter('X', 3, undefined);

    // when
    const actualQuery = new QuerySanitizer(query).sanitize();

    // then
    const expValueRangeFilter = new ValueRangeFilter('X', { min: 5, max: 10, maxExcluding: true });
    expect(actualQuery.getValueRangeFilters()).toEqual([expValueRangeFilter]);
  });
});
