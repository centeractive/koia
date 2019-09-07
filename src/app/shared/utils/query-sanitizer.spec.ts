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

  it('#sanitize should return query with merged value range filter', () => {

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

  it('#sanitize should return query with merged value range filter (max value excluded)', () => {

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

  it('#sanitize should return query with merged value range filter together with inversed filter', () => {

    // given
    const query = new Query();
    query.addValueRangeFilter('X', 0, 100);
    query.addValueRangeFilter('X', 10, 90);
    query.addValueRangeFilter('X', 50, 80, false, true);

    // when
    const actualQuery = new QuerySanitizer(query).sanitize();

    // then
    const expValueRangeFilters = [
      new ValueRangeFilter('X', { min: 10, max: 90, maxExcluding: undefined }),
      new ValueRangeFilter('X', { min: 50, max: 80, maxExcluding: false }, true)
    ];
    expect(actualQuery.getValueRangeFilters()).toEqual(expValueRangeFilters);
  });

  it('#sanitize should return query with merged inverted value range filter (max value excluded)', () => {

    // given
    const query = new Query();
    query.addValueRangeFilter('X', 0, 10, true, true);
    query.addValueRangeFilter('X', 10, 20, true, true);
    query.addValueRangeFilter('X', 20, 30, true, true);

    // when
    const actualQuery = new QuerySanitizer(query).sanitize();

    // then
    const expValueRangeFilter = new ValueRangeFilter('X', { min: 0, max: 30, maxExcluding: true }, true);
    expect(actualQuery.getValueRangeFilters()).toEqual([expValueRangeFilter]);
  });
});
