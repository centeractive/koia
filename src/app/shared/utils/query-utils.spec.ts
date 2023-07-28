import { shuffle } from 'd3';
import { Operator, PropertyFilter, Query } from '../model';
import { QueryUtils } from './query-utils';

describe('QueryUtils', () => {

  it('#areFiltersEqual should return true when queries are same', () => {
    const query = createQuery(true, true, true);

    expect(QueryUtils.areFiltersEqual(query, query)).toBeTrue();
  });

  it('#areFiltersEqual should return true when full text filters are are same', () => {
    const query1 = createQuery(true, false, false);
    const query2 = createQuery(true, false, false);

    expect(QueryUtils.areFiltersEqual(query1, query2)).toBeTrue();
  });

  it('#areFiltersEqual should return true when property filters are are same', () => {
    const query1 = createQuery(false, true, false);
    const query2 = createQuery(false, true, false);

    expect(QueryUtils.areFiltersEqual(query1, query2)).toBeTrue();
  });

  it('#areFiltersEqual should return true when value range filters are are same', () => {
    const query1 = createQuery(false, false, true);
    const query2 = createQuery(false, false, true);

    expect(QueryUtils.areFiltersEqual(query1, query2)).toBeTrue();
  });

  it('#areFiltersEqual should return true when all filters are are same', () => {
    const query1 = createQuery(true, true, true);
    const query2 = createQuery(true, true, true);

    expect(QueryUtils.areFiltersEqual(query1, query2)).toBeTrue();
  });

  it('#areFiltersEqual should return false when full text filters differ', () => {
    const query1 = new Query();
    query1.setFullTextFilter('a');
    const query2 = new Query();
    query1.setFullTextFilter('b');

    expect(QueryUtils.areFiltersEqual(query1, query2)).toBeFalse();
  });

  it('#areFiltersEqual should return false when property filters differ', () => {
    const query1 = createQuery(false, true, false);
    const query2 = createQuery(false, true, false);
    query2.addPropertyFilter(new PropertyFilter('x', Operator.EMPTY, ''));

    expect(QueryUtils.areFiltersEqual(query1, query2)).toBeFalse();
  });

  it('#areFiltersEqual should return false when value range filters differ', () => {
    const query1 = createQuery(false, false, true);
    const query2 = createQuery(false, false, true);
    query2.addValueRangeFilter('x', 10, 20);

    expect(QueryUtils.areFiltersEqual(query1, query2)).toBeFalse();
  });

  function createQuery(fullTextFilter: boolean, propertyFilters: boolean, valueRangeFilters: boolean) {
    const query = new Query();
    if (fullTextFilter) {
      query.setFullTextFilter('abc');
    }
    if (propertyFilters) {
      const names = ['p1', 'p2', 'p3', 'p4', 'p5'];
      shuffle(names).forEach(n => query.addPropertyFilter(new PropertyFilter(n, Operator.EQUAL, 'a')));
    }
    if (valueRangeFilters) {
      const names = ['vr1', 'vr2', 'vr3', 'vr4', 'vr5'];
      shuffle(names).forEach(n => query.addValueRangeFilter(n, 10, 20));
    }
    return query;
  }
});
