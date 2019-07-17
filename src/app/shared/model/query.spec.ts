import { Query } from './query';
import { PropertyFilter } from './property-filter';
import { Operator } from './operator.enum';

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
});
