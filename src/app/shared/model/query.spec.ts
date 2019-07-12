import { Query } from './query';
import { PropertyFilter } from './property-filter';
import { Operator } from './operator.enum';

describe('Query', () => {

  it('#setPropertyFilter should replace previous property filters', () => {

    // given
    const query = new Query();
    query.addPropertyFilter(new PropertyFilter('Path', Operator.EQUAL, '/opt/tomcat/log/catatalina.out'));
    query.addPropertyFilter(new PropertyFilter('Commission', Operator.GREATER_THAN_OR_EQUAL, '2000'));

    // when
    const propertyFilter = new PropertyFilter('Employee', Operator.NOT_EMPTY, '');
    query.setPropertyFilter(new PropertyFilter('Employee', Operator.NOT_EMPTY, ''));

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
