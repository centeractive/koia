import { QueryUtils } from './query-utils';
import { PropertyFilter, Operator } from '../model';

describe('QueryUtils', () => {

  const now = new Date().getTime();
  const nowPlusMin = now + 60_000;

  it('#queryFromParams should return empty query when params is null', () => {

    // when
    const query = QueryUtils.queryFromParams(null);

    // then
    expect(query.hasFilter()).toBeFalsy();
  });

  it('#queryFromParams should return empty query when params is empty', () => {

    // when
    const query = QueryUtils.queryFromParams({});

    // then
    expect(query.hasFilter()).toBeFalsy();
  });

  it('#queryFromParams should return full text filter query', () => {

    // given
    const params = {
      q: '/romantic_joliot#41f6f099'
    }

    // when
    const query = QueryUtils.queryFromParams(params);

    // then
    expect(query.getFullTextFilter()).toEqual('/romantic_joliot#41f6f099');
  });

  it('#queryFromParams should return single property EQUAL filter query', () => {

    // given
    const params = {
      'Log Level Category': 'WARN'
    }

    // when
    const query = QueryUtils.queryFromParams(params);

    // then
    const propertyFilters = query.getPropertyFilters();
    expect(propertyFilters.length).toEqual(1);
    expect(propertyFilters[0]).toEqual(new PropertyFilter('Log Level Category', Operator.EQUAL, 'WARN'));
  });

  it('#queryFromParams should return multiple property filter query', () => {

    // given
    const params = {
      Host_ne: 'server1',
      Path: '/opt/tomcat/log/catatalina.out',
      Level_like: 'ERR',
      Employee_gte: '',
      Amount_lte: '10000',
      Commission_gte: '2000'
    }

    // when
    const query = QueryUtils.queryFromParams(params);

    // then
    const propertyFilters = query.getPropertyFilters();
    expect(propertyFilters.length).toEqual(6);
    expect(propertyFilters[0]).toEqual(new PropertyFilter('Host', Operator.NOT_EQUAL, 'server1'));
    expect(propertyFilters[1]).toEqual(new PropertyFilter('Path', Operator.EQUAL, '/opt/tomcat/log/catatalina.out'));
    expect(propertyFilters[2]).toEqual(new PropertyFilter('Level', Operator.CONTAINS, 'ERR'));
    expect(propertyFilters[3]).toEqual(new PropertyFilter('Employee', Operator.NOT_EMPTY, ''));
    expect(propertyFilters[4]).toEqual(new PropertyFilter('Amount', Operator.LESS_THAN_OR_EQUAL, '10000'));
    expect(propertyFilters[5]).toEqual(new PropertyFilter('Commission', Operator.GREATER_THAN_OR_EQUAL, '2000'));
  });

  it('#queryFromParams should return time period query', () => {

    // given
    const params = {
      Time_gte: now,
      Time_lte: nowPlusMin
    }

    // when
    const query = QueryUtils.queryFromParams(params);

    // then
    expect(query.getTimeStart('Time')).toEqual(now);
    expect(query.getTimeEnd('Time')).toEqual(nowPlusMin);
  });
});
