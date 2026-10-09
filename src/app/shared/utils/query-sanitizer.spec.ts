import { Query, Operator, PropertyFilter, DataType } from '../model';
import { QuerySanitizer } from './query-sanitizer';
import { ValueRangeFilter } from '../value-range/model';

describe('QuerySanitizer', () => {

  it('#sanitize should return unchanged query when no filter exist', () => {

    // given
    const query = new Query();

    // when
    const actualQuery = new QuerySanitizer(query).sanitize();

    // then
    expect(actualQuery).toEqual(query);
  });

  it('#sanitize should return query with full text filter only exists', () => {

    // given
    const query = new Query();
    query.setFullTextFilter('abc');

    // when
    const actualQuery = new QuerySanitizer(query).sanitize();

    // then
    expect(actualQuery).toEqual(query);
  });

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

  it('#sanitize should retain typed property filter when equal untyped property filter follows', () => {

    // given
    const query = new Query();
    query.addPropertyFilter(new PropertyFilter('X', Operator.EQUAL, 'a', DataType.TEXT));
    query.addPropertyFilter(new PropertyFilter('X', Operator.EQUAL, 'a'));

    // when
    const actualQuery = new QuerySanitizer(query).sanitize();

    // then
    expect(actualQuery.getPropertyFilters()).toEqual([new PropertyFilter('X', Operator.EQUAL, 'a', DataType.TEXT)]);
  });

  it('#sanitize should retain typed property filter when equal untyped property filter precedes', () => {

    // given
    const query = new Query();
    query.addPropertyFilter(new PropertyFilter('X', Operator.EQUAL, 'a'));
    query.addPropertyFilter(new PropertyFilter('X', Operator.EQUAL, 'a', DataType.TEXT));

    // when
    const actualQuery = new QuerySanitizer(query).sanitize();

    // then
    expect(actualQuery.getPropertyFilters()).toEqual([new PropertyFilter('X', Operator.EQUAL, 'a', DataType.TEXT)]);
  });

  it('#sanitize should retain both property filters when data types differ', () => {

    // given
    const query = new Query();
    query.addPropertyFilter(new PropertyFilter('X', Operator.EQUAL, '1', DataType.TEXT));
    query.addPropertyFilter(new PropertyFilter('X', Operator.EQUAL, '1', DataType.NUMBER));

    // when
    const actualQuery = new QuerySanitizer(query).sanitize();

    // then
    expect(actualQuery.getPropertyFilters()).toEqual([
      new PropertyFilter('X', Operator.EQUAL, '1', DataType.TEXT),
      new PropertyFilter('X', Operator.EQUAL, '1', DataType.NUMBER)
    ]);
  });

  it('#sanitize should retain both ANY_OF property filters when one lacks data type', () => {

    // given
    const query = new Query();
    query.addPropertyFilter(new PropertyFilter('X', Operator.ANY_OF, '1,2', DataType.NUMBER));
    query.addPropertyFilter(new PropertyFilter('X', Operator.ANY_OF, '1,2'));

    // when
    const actualQuery = new QuerySanitizer(query).sanitize();

    // then
    expect(actualQuery.getPropertyFilters()).toEqual([
      new PropertyFilter('X', Operator.ANY_OF, '1,2', DataType.NUMBER),
      new PropertyFilter('X', Operator.ANY_OF, '1,2')
    ]);
  });

  it('#sanitize should retain all property filters when name, operator or value differ', () => {

    // given
    const query = new Query();
    query.addPropertyFilter(new PropertyFilter('X', Operator.EQUAL, 'a'));
    query.addPropertyFilter(new PropertyFilter('Y', Operator.EQUAL, 'a'));
    query.addPropertyFilter(new PropertyFilter('X', Operator.CONTAINS, 'a'));
    query.addPropertyFilter(new PropertyFilter('X', Operator.EQUAL, 'b'));

    // when
    const actualQuery = new QuerySanitizer(query).sanitize();

    // then
    expect(actualQuery.getPropertyFilters()).toEqual([
      new PropertyFilter('X', Operator.EQUAL, 'a'),
      new PropertyFilter('Y', Operator.EQUAL, 'a'),
      new PropertyFilter('X', Operator.CONTAINS, 'a'),
      new PropertyFilter('X', Operator.EQUAL, 'b')
    ]);
  });

  it('#sanitize should return query with single value range filter when filters are identical', () => {

    // given
    const query = new Query();
    query.addValueRangeFilter('X', 5, 10);
    query.addValueRangeFilter('X', 5, 10);

    // when
    const actualQuery = new QuerySanitizer(query).sanitize();

    // then
    const expValueRangeFilter = new ValueRangeFilter('X', { min: 5, max: 10, maxExcluding: undefined });
    expect(actualQuery.getValueRangeFilters()).toEqual([expValueRangeFilter]);
  });

  it('#sanitize should return query with single inverted value range filter when inverted filters are identical', () => {

    // given
    const query = new Query();
    query.addValueRangeFilter('X', 5, 10, true, true);
    query.addValueRangeFilter('X', 5, 10, true, true);

    // when
    const actualQuery = new QuerySanitizer(query).sanitize();

    // then
    const expValueRangeFilter = new ValueRangeFilter('X', { min: 5, max: 10, maxExcluding: true }, true);
    expect(actualQuery.getValueRangeFilters()).toEqual([expValueRangeFilter]);
  });
});
