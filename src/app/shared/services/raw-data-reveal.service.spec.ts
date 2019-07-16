import { RawDataRevealService } from './raw-data-reveal.service';
import {
  Query, ElementContext, Route, SummaryContext, GraphNode, GraphContext, PropertyFilter, DataType,
  TimeUnit, Operator, Column
} from '../model';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material';

describe('RawDataRevealService', () => {

  const now = new Date().getTime();
  const min = 60_000;
  const oneHourAgo = now - (60 * min);
  const linkbase = '/' + Route.RAWDATA;

  let query: Query;
  let context: ElementContext;
  let router: Router;
  let dialogService: MatDialog; 
  let service: RawDataRevealService;

  beforeEach(() => {
    query = new Query();
    context = new SummaryContext([]);
    context.query = query;
    router = <Router> { navigateByUrl: (url: string) => null };
    dialogService = <MatDialog> {};
    service = new RawDataRevealService(router, dialogService);
    service.setUseDialog(false);
    spyOn(router, 'navigateByUrl');
  });

  it('#createIDLink should create link with ID', () => {

    // when
    service.ofID(100);

    // then
    expect(router.navigateByUrl).toHaveBeenCalledWith(linkbase + '?_id=100');
  });

  it('#createGraphNodeLink should return link for root node', () => {

    // given
    const rootNode: GraphNode = { parent: null, group: 0, name: '', value: null, info: '25' };
    const graphContext = new GraphContext([]);
    graphContext.query = new Query();

    // when
    service.ofGraphNode(rootNode, graphContext);

    // then
    expect(router.navigateByUrl).toHaveBeenCalledWith(linkbase);
  });

  it('#createGraphNodeLink should show alert when node column value <empty>', () => {

    // given
    const rootNode: GraphNode = { parent: null, group: 0, name: '', value: null, info: '' };
    const node: GraphNode = { parent: rootNode, group: 1, name: 'Level', value: PropertyFilter.EMPTY, info: '25' };
    const graphContext = new GraphContext([]);
    spyOn(window, 'alert').and.stub();

    // when
    service.ofGraphNode(node, graphContext);

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
    service.ofGraphNode(node, graphContext);

    // then
    expect(router.navigateByUrl).toHaveBeenCalledWith(linkbase + '?Level=ERROR');
  });

  it('#createGraphNodeLink should return link when time node', () => {

    // given
    const rootNode: GraphNode = { parent: null, group: 0, name: '', value: null, info: '' };
    const node: GraphNode = { parent: rootNode, group: 1, name: 'Time (per hour)', value: oneHourAgo, info: '25' };
    const graphContext = new GraphContext([]);
    graphContext.groupByColumns = [createColumn('Time', DataType.TIME, TimeUnit.HOUR)];
    graphContext.query = new Query();

    // when
    service.ofGraphNode(node, graphContext);

    // then
    expect(router.navigateByUrl).toHaveBeenCalledWith(linkbase + '?Time_gte=' + oneHourAgo + '&Time_lte=' + now);
  });

  it('#createTimeUnitLink should create link with time period of entire timeunit', () => {

    // given
    const timeColumn = createColumn('Time', DataType.TIME, TimeUnit.MINUTE);

    // when
    service.ofTimeUnit(context, [timeColumn], [oneHourAgo], ['Level'], ['ERROR']);

    // then
    expect(router.navigateByUrl).toHaveBeenCalledWith(
      linkbase + '?Time_gte=' + oneHourAgo + '&Time_lte=' + (oneHourAgo + 60_000) + '&Level=ERROR');
  });

  it('#createTimeUnitLink should create link with time period of trimmed timeunit', () => {

    // given
    const timeColumn = createColumn('Time', DataType.TIME, TimeUnit.HOUR);
    query.setTimeStart('Time', oneHourAgo + min);
    query.setTimeEnd('Time', now - min);

    // when
    service.ofTimeUnit(context, [timeColumn], [oneHourAgo], ['Host'], ['server1']);

    // then
    expect(router.navigateByUrl).toHaveBeenCalledWith(
      linkbase + '?Time_gte=' + (oneHourAgo + min) + '&Time_lte=' + (now - min) + '&Host=server1');
  });

  it('#createLink should create bare link', () => {

    // when
    service.ofQuery(query, [], []);

    // then
    expect(router.navigateByUrl).toHaveBeenCalledWith(linkbase);
  });

  it('#createLink should create link with escaped # from base query full text filter', () => {

    // given
    query.setFullTextFilter('x#y');

    // when
    service.ofQuery(query, [], []);

    // then
    expect(router.navigateByUrl).toHaveBeenCalledWith(linkbase + '?q=x%23y');
  });

  it('#createLink should create link from base query full text filter and property filters', () => {

    // given
    query.setFullTextFilter('asdf');
    query.addPropertyFilter(new PropertyFilter('Host', Operator.EQUAL, 'server1'));
    query.addPropertyFilter(new PropertyFilter('Path', Operator.CONTAINS, '.log'));

    // when
    service.ofQuery(query, [], []);

    // then
    expect(router.navigateByUrl).toHaveBeenCalledWith(linkbase + '?q=asdf&Host=server1&Path_like=.log');
  });

  it('#createLink should create link with single property filter', () => {

    // when
    service.ofQuery(query, ['Level'], ['ERROR']);

    // then
    expect(router.navigateByUrl).toHaveBeenCalledWith(linkbase + '?Level=ERROR');
  });

  it('#createLink should create link with multiple property filters', () => {

    // given
    const columnNames = ['Host', 'Path', 'Level'];
    const columnValues = ['Server', '/opt/tomcat/log/catalina.log', 'ERROR'];

    // when
    service.ofQuery(query, columnNames, columnValues);

    // then
    expect(router.navigateByUrl).toHaveBeenCalledWith(linkbase + '?Host=Server&Path=/opt/tomcat/log/catalina.log&Level=ERROR');
  });

  it('#createLink should create link for time period', () => {

    // given
    query.setTimeStart('Time', oneHourAgo);
    query.setTimeEnd('Time', now);

    // when
    service.ofQuery(query, [], []);

    // then
    expect(router.navigateByUrl).toHaveBeenCalledWith(linkbase + '?Time_gte=' + oneHourAgo + '&Time_lte=' + now);
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
    service.ofQuery(query, columnNames, columnValues);

    // then
    expect(router.navigateByUrl).toHaveBeenCalledWith(
      linkbase + '?q=xyz&Host_gte=&Path_like=.txt&Time_gte=' + oneHourAgo + '&Time_lte=' + now + '&Level=WARN&Amount=1000');
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
