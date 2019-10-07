import { RawDataRevealService } from './raw-data-reveal.service';
import {
  Query, ElementContext, Route, SummaryContext, GraphNode, GraphContext, PropertyFilter, DataType,
  TimeUnit, Operator, Column
} from '../model';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material';
import { CouchDBConstants } from './backend/couchdb';
import { RawDataDialogComponent } from 'app/raw-data/raw-data-dialog.component';

class MatDialogMock {
  open() { }
}

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
    router = <Router>{ navigateByUrl: (url: string) => null };
    const matDialog: unknown = { open: () => null };
    dialogService = <MatDialog>matDialog;
    service = new RawDataRevealService(router, dialogService);
    spyOn(dialogService, 'open');
    spyOn(router, 'navigateByUrl');
  });

  it('#ofID should show raw data dialog for ID', () => {

    // when
    service.ofID('100');

    // then
    const expectedQuery = new Query(new PropertyFilter(CouchDBConstants._ID, Operator.EQUAL, '100', DataType.TEXT));
    expect(dialogService.open).toHaveBeenCalledWith(RawDataDialogComponent, { data: expectedQuery, panelClass: 'dialog-container' });
  });

  it('#ofID should navigate to raw data view with ID', () => {

    // given
    service.setUseDialog(false);

    // when
    service.ofID('100');

    // then
    expect(router.navigateByUrl).toHaveBeenCalledWith(linkbase + '?_id=100');
  });

  it('#ofTimeUnit should navigate to raw data view for time period of entire timeunit', () => {

    // given
    service.setUseDialog(false);
    const timeColumn = createColumn('Time', DataType.TIME, TimeUnit.MINUTE);

    // when
    service.ofTimeUnit(context.query, [timeColumn], [oneHourAgo], ['Level'], ['ERROR']);

    // then
    expect(router.navigateByUrl).toHaveBeenCalledWith(
      linkbase + '?Level=ERROR&Time_gte=' + oneHourAgo + '&Time_lte=' + (oneHourAgo + 60_000));
  });

  it('#ofTimeUnit should navigate to raw data view for time period of trimmed timeunit', () => {

    // given
    service.setUseDialog(false);
    const timeColumn = createColumn('Time', DataType.TIME, TimeUnit.HOUR);
    query.addValueRangeFilter('Time', oneHourAgo + min, now - min);

    // when
    service.ofTimeUnit(context.query, [timeColumn], [oneHourAgo], ['Host'], ['server1']);

    // then
    expect(router.navigateByUrl).toHaveBeenCalledWith(
      linkbase + '?Host=server1&Time_gte=' + (oneHourAgo + min) + '&Time_lte=' + (now - min));
  });

  it('#ofQuery should navigate to raw data view for query', () => {

    // given
    service.setUseDialog(false);

    // when
    service.ofQuery(query, [], []);

    // then
    expect(router.navigateByUrl).toHaveBeenCalledWith(linkbase);
  });

  it('#ofQuery should should navigate to raw data view (escaped # from base query full text filter)', () => {

    // given
    service.setUseDialog(false);
    query.setFullTextFilter('x#y');

    // when
    service.ofQuery(query, [], []);

    // then
    expect(router.navigateByUrl).toHaveBeenCalledWith(linkbase + '?q=x%23y');
  });

  it('#ofQuery should navigate to raw data view for base query full text filter and property filters', () => {

    // given
    service.setUseDialog(false);
    query.setFullTextFilter('asdf');
    query.addPropertyFilter(new PropertyFilter('Host', Operator.EQUAL, 'server1'));
    query.addPropertyFilter(new PropertyFilter('Path', Operator.CONTAINS, '.log'));

    // when
    service.ofQuery(query, [], []);

    // then
    expect(router.navigateByUrl).toHaveBeenCalledWith(linkbase + '?q=asdf&Host=server1&Path_like=.log');
  });

  it('#ofQuery should navigate to raw data view for single property filter', () => {

    // given
    service.setUseDialog(false);

    // when
    service.ofQuery(query, ['Level'], ['ERROR']);

    // then
    expect(router.navigateByUrl).toHaveBeenCalledWith(linkbase + '?Level=ERROR');
  });

  it('#ofQuery should navigate to raw data view for multiple property filters', () => {

    // given
    service.setUseDialog(false);
    const columnNames = ['Host', 'Path', 'Level'];
    const columnValues = ['Server', '/opt/tomcat/log/catalina.log', 'ERROR'];

    // when
    service.ofQuery(query, columnNames, columnValues);

    // then
    expect(router.navigateByUrl).toHaveBeenCalledWith(linkbase + '?Host=Server&Path=/opt/tomcat/log/catalina.log&Level=ERROR');
  });

  it('#ofQuery should navigate to raw data view for time period', () => {

    // given
    service.setUseDialog(false);
    query.addValueRangeFilter('Time', oneHourAgo, now);

    // when
    service.ofQuery(query, [], []);

    // then
    expect(router.navigateByUrl).toHaveBeenCalledWith(linkbase + '?Time_gte=' + oneHourAgo + '&Time_lte=' + now);
  });

  it('#ofQuery should navigate to raw data view for base query and additional attributes', () => {

    // given
    service.setUseDialog(false);
    query.setFullTextFilter('xyz');
    query.addPropertyFilter(new PropertyFilter('Host', Operator.NOT_EMPTY, ''));
    query.addPropertyFilter(new PropertyFilter('Path', Operator.CONTAINS, '.txt'));
    query.addValueRangeFilter('Time', oneHourAgo, now);
    const columnNames = ['Level', 'Amount'];
    const columnValues = ['WARN', '1000'];

    // when
    service.ofQuery(query, columnNames, columnValues);

    // then
    expect(router.navigateByUrl).toHaveBeenCalledWith(
      linkbase + '?q=xyz&Host_gte=&Path_like=.txt&Level=WARN&Amount=1000&Time_gte=' + oneHourAgo + '&Time_lte=' + now);
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
