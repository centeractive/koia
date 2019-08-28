import { Query } from './query';
import { PropertyFilter } from './property-filter';
import { Operator } from './operator.enum';
import { ValueRangeFilter } from '../value-range/model';

describe('Query', () => {

  it('#constructor should add initial property filter', () => {

    // given
    const propertyFilter = new PropertyFilter('Employee', Operator.NOT_EMPTY, '');

    // when
    const query = new Query(propertyFilter);

    // then
    const propertyFilters = query.getPropertyFilters();
    expect(propertyFilters.length).toEqual(1);
    expect(propertyFilters[0]).toEqual(propertyFilter);
  });

  it('#hasFilter should return false when no filters exist', () => {

    // given
    const query = new Query();

    // when/then
    expect(query.hasFilter()).toBeFalsy();
    expect(query.hasFullTextFilter()).toBeFalsy();
  });

  it('#hasFilter should return true when text filter exist', () => {

    // given
    const query = new Query();
    query.setFullTextFilter('abc');

    // when/then
    expect(query.hasFilter()).toBeTruthy();
    expect(query.hasFullTextFilter()).toBeTruthy();
  });

  it('#hasFilter should return true when applicable property filter exists', () => {

    // given
    const query = new Query(new PropertyFilter('Employee', Operator.NOT_EMPTY, ''));

    // when
    const hasFilter = query.hasFilter();

    // then
    expect(hasFilter).toBeTruthy();
  });

  it('#hasFilter should return false when non-applicable property filter exists', () => {

    // given
    const query = new Query(new PropertyFilter('Employee', Operator.CONTAINS, ''));

    // when
    const hasFilter = query.hasFilter();

    // then
    expect(hasFilter).toBeFalsy();
  });

  it('#hasFilter should return true when applicable value range filter exists', () => {

    // given
    const query = new Query();
    query.addValueRangeFilter('Amount', 5, 10);

    // when
    const hasFilter = query.hasFilter();

    // then
    expect(hasFilter).toBeTruthy();
  });

  it('#hasFilter should return true when non-applicable value range filter exists', () => {

    // given
    const query = new Query();
    query.addValueRangeFilter('Amount', null, null);

    // when
    const hasFilter = query.hasFilter();

    // then
    expect(hasFilter).toBeFalsy();
  });

  it('#hasFilter should return false when all filter are non-applicable', () => {

    // given
    const query = new Query(new PropertyFilter('Employee', Operator.EQUAL, ''));
    query.addValueRangeFilter('Amount', undefined, undefined);
    query.addValueRangeFilter('Percent', null, null);

    // when
    const hasFilter = query.hasFilter();

    // then
    expect(hasFilter).toBeFalsy();
  });

  it('#clearSort should clear sort', () => {

    // given
    const query = new Query();
    query.setSort({ active: 'Amount', direction: 'desc' });

    // when
    query.clearSort();

    // then
    expect(query.getSort()).toBeUndefined();
  });

  it('#setPageDefinition should alter query for page request', () => {

    // given
    const query = new Query();

    // when
    query.setPageDefinition(8, 10);

    // then
    expect(query.hasPageDefinition()).toBeTruthy();
    expect(query.getPageIndex()).toBe(8);
    expect(query.getRowsPerPage()).toBe(10);
  });

  it('#clearPageDefinition should clear page definition', () => {

    // given
    const query = new Query();
    query.setPageDefinition(0, 5);

    // when
    query.clearPageDefinition();

    // then
    expect(query.hasPageDefinition()).toBeFalsy();
    expect(query.getPageIndex()).toBeUndefined();
    expect(query.getRowsPerPage()).toBeUndefined();
  });

  it('#clone should clone query', () => {

    // given
    const query = new Query(new PropertyFilter('Employee', Operator.EQUAL, 'x'));
    query.addPropertyFilter(new PropertyFilter('Company', Operator.NOT_EMPTY, ''))
    query.setFullTextFilter('abc');
    query.addValueRangeFilter('Amount', 100, 105);
    query.addValueRangeFilter('Percent', 3, 6);
    query.setSort({ active: 'Amount', direction: 'desc' });
    query.setPageDefinition(10, 5);

    // when
    const clone = query.clone();

    // then
    expect(clone.getFullTextFilter()).toBe('abc');
    expect(clone.getPropertyFilters()).toEqual([
      new PropertyFilter('Employee', Operator.EQUAL, 'x'),
      new PropertyFilter('Company', Operator.NOT_EMPTY, '')
    ]);
    expect(clone.getValueRangeFilters()).toEqual([
      new ValueRangeFilter('Amount', { min: 100, max: 105, maxExcluding: undefined }),
      new ValueRangeFilter('Percent', { min: 3, max: 6, maxExcluding: undefined})
    ]);
    expect(clone.getSort()).toEqual( { active: 'Amount', direction: 'desc' });
    expect(clone.getPageIndex()).toBe(10);
    expect(clone.getRowsPerPage()).toBe(5);
  });
});
