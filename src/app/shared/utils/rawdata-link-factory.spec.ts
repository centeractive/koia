import { RawDataLinkFactory } from './rawdata-link-factory';
import {
  Query, PropertyFilter, Operator, Route, ElementContext, SummaryContext, GraphNode, GraphContext,
  DataType, Column, TimeUnit
} from '../model';

describe('RawDataLinkFactory', () => {

  const now = new Date().getTime();
  const min = 60_000;
  const oneHourAgo = now - (60 * min);
  const linkbase = '/' + Route.RAWDATA;

  let query: Query;
  let context: ElementContext;

  beforeEach(() => {
    query = new Query();
    context = new SummaryContext([]);
    context.query = query;
  });

  it('#createIDLink should create link with ID', () => {

    // when
    const link = RawDataLinkFactory.createIDLink(100);

    // then
    expect(link).toEqual(linkbase + '?_id=100');
  });

  it('#createGraphNodeLink should return link for root node', () => {

    // given
    const rootNode: GraphNode = { parent: null, group: 0, name: '', value: null, info: '25' };
    const graphContext = new GraphContext([]);
    graphContext.query = new Query();

    // when
    const link = RawDataLinkFactory.createGraphNodeLink(rootNode, graphContext);

    // then
    expect(link).toEqual(linkbase);
  });

  it('#createGraphNodeLink should show alert when node column value <empty>', () => {

    // given
    const rootNode: GraphNode = { parent: null, group: 0, name: '', value: null, info: '' };
    const node: GraphNode = { parent: rootNode, group: 1, name: 'Level', value: PropertyFilter.EMPTY, info: '25' };
    const graphContext = new GraphContext([]);
    spyOn(window, 'alert').and.stub();

    // when
    const link = RawDataLinkFactory.createGraphNodeLink(node, graphContext);

    // then
    expect(window.alert).toHaveBeenCalledWith('<empty> search criteria is not implemented.\n' +
      'Therefore, contextual data cannot be requested from server.');
  });

  it('#createGraphNodeLink should return link when leaf node', () => {

    // given
    const rootNode: GraphNode = { parent: null, group: 0, name: '', value: null, info: '' };
    const node: GraphNode = { parent: rootNode, group: 1, name: 'Level', value: 'ERROR', info: '25' };
    const graphContext = new GraphContext([]);
    graphContext.groupByColumns = [createColumn('Level', DataType.TEXT)];
    graphContext.query = new Query();

    // when
    const link = RawDataLinkFactory.createGraphNodeLink(node, graphContext);

    // then
    expect(link).toEqual(linkbase + '?Level=ERROR');
  });

  it('#createGraphNodeLink should return link when time node', () => {

    // given
    const rootNode: GraphNode = { parent: null, group: 0, name: '', value: null, info: '' };
    const node: GraphNode = { parent: rootNode, group: 1, name: 'Time (per hour)', value: oneHourAgo, info: '25' };
    const graphContext = new GraphContext([]);
    graphContext.groupByColumns = [createColumn('Time', DataType.TIME, TimeUnit.HOUR)];
    graphContext.query = new Query();

    // when
    const link = RawDataLinkFactory.createGraphNodeLink(node, graphContext);

    // then
    expect(link).toEqual(linkbase + '?Time_gte=' + oneHourAgo + '&Time_lte=' + now);
  });

  it('#createTimeUnitLink should create link with time period of entire timeunit', () => {

    // given
    const timeColumn = createColumn('Time', DataType.TIME, TimeUnit.MINUTE);

    // when
    const link = RawDataLinkFactory.createTimeUnitLink(context, [timeColumn], [oneHourAgo], ['Level'], ['ERROR']);

    // then
    expect(link).toEqual(linkbase + '?Time_gte=' + oneHourAgo + '&Time_lte=' + (oneHourAgo + 60_000) + '&Level=ERROR');
  });

  it('#createTimeUnitLink should create link with time period of trimmed timeunit', () => {

    // given
    const timeColumn = createColumn('Time', DataType.TIME, TimeUnit.HOUR);
    query.setTimeStart('Time', oneHourAgo + min);
    query.setTimeEnd('Time', now - min);

    // when
    const link = RawDataLinkFactory.createTimeUnitLink(context, [timeColumn], [oneHourAgo], ['Host'], ['server1']);

    // then
    expect(link).toEqual(linkbase + '?Time_gte=' + (oneHourAgo + min) + '&Time_lte=' + (now - min) + '&Host=server1');
  });

  it('#createLink should create bare link', () => {

    // when
    const link = RawDataLinkFactory.createLink(query, [], []);

    // then
    expect(link).toEqual(linkbase);
  });

  it('#createLink should create link with escaped # from base query full text filter', () => {

    // given
    query.setFullTextFilter('x#y');

    // when
    const link = RawDataLinkFactory.createLink(query, [], []);

    // then
    expect(link).toEqual(linkbase + '?q=x%23y');
  });

  it('#createLink should create link from base query full text filter and property filters', () => {

    // given
    query.setFullTextFilter('asdf');
    query.addPropertyFilter(new PropertyFilter('Host', Operator.EQUAL, 'server1'));
    query.addPropertyFilter(new PropertyFilter('Path', Operator.CONTAINS, '.log'));

    // when
    const link = RawDataLinkFactory.createLink(query, [], []);

    // then
    expect(link).toEqual(linkbase + '?q=asdf&Host=server1&Path_like=.log');
  });

  it('#createLink should create link with single property filter', () => {

    // when
    const link = RawDataLinkFactory.createLink(query, ['Level'], ['ERROR']);

    // then
    expect(link).toEqual(linkbase + '?Level=ERROR');
  });

  it('#createLink should create link with multiple property filters', () => {

    // given
    const columnNames = ['Host', 'Path', 'Level'];
    const columnValues = ['Server', '/opt/tomcat/log/catalina.log', 'ERROR'];

    // when
    const link = RawDataLinkFactory.createLink(query, columnNames, columnValues);

    // then
    expect(link).toEqual(linkbase + '?Host=Server&Path=/opt/tomcat/log/catalina.log&Level=ERROR');
  });

  it('#createLink should create link for time period', () => {

    // given
    query.setTimeStart('Time', oneHourAgo);
    query.setTimeEnd('Time', now);

    // when
    const link = RawDataLinkFactory.createLink(query, [], []);

    // then
    expect(link).toEqual(linkbase + '?Time_gte=' + oneHourAgo + '&Time_lte=' + now);
  });

  it('#createLink should create link from base query and additional attributes', () => {

    // given
    query.setFullTextFilter('xyz');
    query.addPropertyFilter(new PropertyFilter('Host', Operator.NOT_EMPTY, ''));
    query.addPropertyFilter(new PropertyFilter('Path', Operator.CONTAINS, '.txt'));
    query.setTimeStart('Time', oneHourAgo);
    query.setTimeEnd('Time', now);
    const columnNames = ['Level', 'Amount'];
    const columnValues = ['WARN', '1000'];

    // when
    const link = RawDataLinkFactory.createLink(query, columnNames, columnValues);

    // then
    expect(link).toEqual(linkbase + '?q=xyz&Host_gte=&Path_like=.txt&Time_gte=' + oneHourAgo + '&Time_lte=' + now +
      '&Level=WARN&Amount=1000');
  });

  function createColumn(name: string, dataType: DataType, timeUnit?: TimeUnit): Column {
    return {
      name: name,
      dataType: dataType,
      width: 10,
      groupingTimeUnit: timeUnit
    };
  }
});
