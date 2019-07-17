import { JSQueryFactory } from './js-query-factory';
import { PropertyFilter, Operator, Query } from 'app/shared/model';

describe('JSQueryFactory', () => {

  const now = new Date().getTime();
  const queryFactory = new JSQueryFactory();

  it('#create should return amount range query', () => {

    // given
    const query = new Query();
    query.addPropertyFilter(new PropertyFilter('Amount', Operator.GREATER_THAN_OR_EQUAL, '18'));
    query.addPropertyFilter(new PropertyFilter('Amount', Operator.LESS_THAN_OR_EQUAL, '22'));

    // when
    const queryString = queryFactory.create(query);

    // then
    expect(queryString).toBe('?Amount_gte=18&Amount_lte=22');
  });

  it('#create should return time range query', () => {

    // given
    const query = new Query();
    query.addValueRangeFilter('Time', now, now + 1_000);

    // when
    const queryString = queryFactory.create(query);

    // then
    expect(queryString).toBe('?Time_gte=' + now + '&Time_lte=' + (now + 1_000));
  });

  it('#create should return query without redundant property filter', () => {

    // given
    const query = new Query();
    query.addPropertyFilter(new PropertyFilter('Amount', Operator.NOT_EMPTY, ''));
    query.addPropertyFilter(new PropertyFilter('Amount', Operator.LESS_THAN_OR_EQUAL, '22'));

    // when
    const queryString = queryFactory.create(query);

    // then
    expect(queryString).toBe('?Amount_lte=22');
  });

  it('#create should return query for ascending sort', () => {

    // given
    const query = new Query();
    query.setSort({ active: 'Level', direction: 'asc' });

    // when
    const queryString = queryFactory.create(query);

    // then
    expect(queryString).toEqual('?_sort=Level&_order=asc');
  });

  it('#create should return query for descending sort', () => {

    // given
    const query = new Query();
    query.setSort({ active: 'Time', direction: 'desc' });

    // when
    const queryString = queryFactory.create(query);

    // then
    expect(queryString).toEqual('?_sort=Time&_order=desc');
  });

  it('#create should return page query', () => {

    // given
    const query = new Query();
    query.setPageDefinition(8, 10);

    // when
    const queryString = queryFactory.create(query);

    // then
    expect(queryString).toBe('?_page=9&_limit=10');
  });
});
