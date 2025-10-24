import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RawDataDialogComponent } from 'app/raw-data/raw-data-dialog.component';
import { Column, DataType, ElementContext, Operator, PropertyFilter, Query, SummaryContext, TimeUnit } from '../model';
import { ValueRangeFilter } from '../value-range/model';
import { CouchDBConstants } from './backend/couchdb';
import { RawDataRevealService } from './raw-data-reveal.service';

class MatDialogMock {
  open() {
    // ignore
  }
}

describe('RawDataRevealService', () => {

  const now = new Date().getTime();
  const min = 60_000;
  const oneHourAgo = now - (60 * min);

  let timeColumn: Column;
  let levelColumn: Column;
  let hostColumn: Column;
  let pathColumn: Column;
  let amountColumn: Column;

  let query: Query;
  let context: ElementContext;
  let service: RawDataRevealService;
  let dialogService: MatDialog;
  let dialogServiceOpenSpy: jasmine.Spy;

  beforeEach(() => {
    initColumns();
    query = new Query();
    context = new SummaryContext([timeColumn, levelColumn, hostColumn, pathColumn, amountColumn]);
    context.query = query;
    TestBed.configureTestingModule({
      imports: [MatDialogModule],
      providers: [RawDataRevealService]
    });
    service = TestBed.inject(RawDataRevealService);
    dialogService = TestBed.inject(MatDialog);
    dialogServiceOpenSpy = spyOn(dialogService, 'open').and.returnValue(null);
  });

  function initColumns() {
    timeColumn = createColumn('Time', DataType.TIME, TimeUnit.MINUTE);
    levelColumn = createColumn('Level', DataType.TEXT);
    hostColumn = createColumn('Host', DataType.TEXT);
    pathColumn = createColumn('Path', DataType.TEXT);
    amountColumn = createColumn('Amount', DataType.NUMBER);
  }

  it('#ofID should show raw data dialog for ID', () => {

    // when
    service.ofID('100');

    // then
    const expectedQuery = new Query(new PropertyFilter(CouchDBConstants._ID, Operator.EQUAL, '100', DataType.TEXT));
    expect(dialogService.open).toHaveBeenCalledWith(RawDataDialogComponent, {
      data: expectedQuery,
      panelClass: 'dialog-container',
      enterAnimationDuration: 1,
      exitAnimationDuration: 1
    });
  });

  it('#ofID should navigate to raw data view with ID', () => {

    // when
    service.ofID('100');

    // then
    expect(dialogServiceOpenSpy).toHaveBeenCalled();
    const actualQuery: Query = dialogServiceOpenSpy.calls.argsFor(0)[1].data;
    expect(actualQuery.getPropertyFilters()).toEqual([new PropertyFilter(CouchDBConstants._ID, Operator.EQUAL, '100', DataType.TEXT)]);
    expect(actualQuery.getValueRangeFilters()).toEqual([]);
  });

  it('#ofTimeUnit should navigate to raw data view for time period of entire timeunit', () => {

    // when
    service.ofTimeUnit(context.query, [timeColumn], [oneHourAgo], ['Level'], ['ERROR'], context);

    // then
    expect(dialogServiceOpenSpy).toHaveBeenCalled();
    const actualQuery: Query = dialogServiceOpenSpy.calls.argsFor(0)[1].data;
    expect(actualQuery.getPropertyFilters()).toEqual([new PropertyFilter('Level', Operator.EQUAL, 'ERROR')]);
    expect(actualQuery.getValueRangeFilters()).toEqual([
      new ValueRangeFilter('Time', { min: oneHourAgo, max: oneHourAgo + min, maxExcluding: undefined })
    ]);
  });

  it('#ofTimeUnit should navigate to raw data view for time period of trimmed timeunit', () => {

    // given
    timeColumn.groupingTimeUnit = TimeUnit.HOUR;
    query.addValueRangeFilter('Time', oneHourAgo + min, now - min);

    // when
    service.ofTimeUnit(context.query, [timeColumn], [oneHourAgo], ['Host'], ['server1'], context);

    // then
    expect(dialogServiceOpenSpy).toHaveBeenCalled();
    const actualQuery: Query = dialogServiceOpenSpy.calls.argsFor(0)[1].data;
    expect(actualQuery.getPropertyFilters()).toEqual([new PropertyFilter('Host', Operator.EQUAL, 'server1')]);
    expect(actualQuery.getValueRangeFilters()).toEqual([
      new ValueRangeFilter('Time', { min: oneHourAgo + min, max: now - min, maxExcluding: undefined })
    ]);
  });

  it('#ofTimeUnit should navigate to raw data view for for time period when base query time range min is undefined', () => {

    // given
    timeColumn.groupingTimeUnit = TimeUnit.HOUR;
    query.addValueRangeFilter('Time', undefined, now - min);

    // when
    service.ofTimeUnit(context.query, [timeColumn], [oneHourAgo], ['Host'], ['server1'], context);

    // then
    expect(dialogServiceOpenSpy).toHaveBeenCalled();
    const actualQuery: Query = dialogServiceOpenSpy.calls.argsFor(0)[1].data;
    expect(actualQuery.getPropertyFilters()).toEqual([new PropertyFilter('Host', Operator.EQUAL, 'server1')]);
    expect(actualQuery.getValueRangeFilters()).toEqual([
      new ValueRangeFilter('Time', { min: oneHourAgo, max: now - min, maxExcluding: undefined })
    ]);
  });

  it('#ofTimeUnit should navigate to raw data view for time period when base query value time max is undefined', () => {

    // given
    timeColumn.groupingTimeUnit = TimeUnit.MINUTE;
    query.addValueRangeFilter('Time', oneHourAgo, undefined);

    // when
    service.ofTimeUnit(context.query, [timeColumn], [now - min], ['Host'], ['server1'], context);

    // then
    expect(dialogServiceOpenSpy).toHaveBeenCalled();
    const actualQuery: Query = dialogServiceOpenSpy.calls.argsFor(0)[1].data;
    expect(actualQuery.getPropertyFilters()).toEqual([new PropertyFilter('Host', Operator.EQUAL, 'server1')]);
    expect(actualQuery.getValueRangeFilters()).toEqual([
      new ValueRangeFilter('Time', { min: now - min, max: now, maxExcluding: undefined })
    ]);
  });

  it('#ofQuery should navigate to raw data view for query', () => {

    // when
    service.ofQuery(query, [], [], context);

    // then
    expect(dialogServiceOpenSpy).toHaveBeenCalled();
    const actualQuery: Query = dialogServiceOpenSpy.calls.argsFor(0)[1].data;
    expect(actualQuery.hasFilter()).toBeFalse();
  });

  it('#ofQuery should should navigate to raw data dialog with full text filter', () => {

    // given
    query.setFullTextFilter('abc');

    // when
    service.ofQuery(query, [], [], context);

    // then
    expect(dialogServiceOpenSpy).toHaveBeenCalled();
    const actualQuery: Query = dialogServiceOpenSpy.calls.argsFor(0)[1].data;
    expect(actualQuery.getFullTextFilter()).toEqual('abc');
    expect(actualQuery.getPropertyFilters()).toEqual([]);
    expect(actualQuery.getValueRangeFilters()).toEqual([]);
  });

  it('#ofQuery should navigate to raw data view for base query full text filter and property filters', () => {

    // given
    query.setFullTextFilter('asdf');
    query.addPropertyFilter(new PropertyFilter('Host', Operator.EQUAL, 'server1'));
    query.addPropertyFilter(new PropertyFilter('Path', Operator.CONTAINS, '.log'));

    // when
    service.ofQuery(query, [], [], context);

    // then
    expect(dialogServiceOpenSpy).toHaveBeenCalled();
    const actualQuery: Query = dialogServiceOpenSpy.calls.argsFor(0)[1].data;
    expect(actualQuery.getFullTextFilter()).toBe('asdf');
    expect(actualQuery.getPropertyFilters()).toEqual([
      new PropertyFilter('Host', Operator.EQUAL, 'server1'),
      new PropertyFilter('Path', Operator.CONTAINS, '.log')
    ]);
    expect(actualQuery.getValueRangeFilters()).toEqual([]);
  });

  it('#ofQuery should navigate to raw data view for single property filter', () => {

    // when
    service.ofQuery(query, ['Level'], ['ERROR'], context);

    // then
    expect(dialogServiceOpenSpy).toHaveBeenCalled();
    const actualQuery: Query = dialogServiceOpenSpy.calls.argsFor(0)[1].data;
    expect(actualQuery.hasFullTextFilter()).toBeFalse();
    expect(actualQuery.getPropertyFilters()).toEqual([new PropertyFilter('Level', Operator.EQUAL, 'ERROR')]);
    expect(actualQuery.getValueRangeFilters()).toEqual([]);
  });

  it('#ofQuery should navigate to raw data view for single time range filter', () => {

    // when
    service.ofQuery(query, ['Time'], [now], context);

    // then
    expect(dialogServiceOpenSpy).toHaveBeenCalled();
    const actualQuery: Query = dialogServiceOpenSpy.calls.argsFor(0)[1].data;
    expect(actualQuery.hasFullTextFilter()).toBeFalse();
    expect(actualQuery.getPropertyFilters()).toEqual([]);
    expect(actualQuery.getValueRangeFilters()).toEqual([new ValueRangeFilter('Time', { min: now, max: now, maxExcluding: undefined })]);
  });

  it('#ofQuery should navigate to raw data view for time range filter and multiple property filters', () => {

    // given
    const columnNames = ['Time', 'Host', 'Path', 'Level'];
    const columnValues = [now, 'Server', '/opt/tomcat/log/catalina.log', 'ERROR'];

    // when
    service.ofQuery(query, columnNames, columnValues, context);

    // then
    expect(dialogServiceOpenSpy).toHaveBeenCalled();
    const actualQuery: Query = dialogServiceOpenSpy.calls.argsFor(0)[1].data;
    expect(actualQuery.hasFullTextFilter()).toBeFalse();
    expect(actualQuery.getPropertyFilters()).toEqual([
      new PropertyFilter('Host', Operator.EQUAL, 'Server'),
      new PropertyFilter('Path', Operator.EQUAL, '/opt/tomcat/log/catalina.log'),
      new PropertyFilter('Level', Operator.EQUAL, 'ERROR')
    ]);
    expect(actualQuery.getValueRangeFilters()).toEqual([new ValueRangeFilter('Time', { min: now, max: now, maxExcluding: undefined })]);
  });

  it('#ofQuery should navigate to raw data view for time period', () => {

    // given
    query.addValueRangeFilter('Time', oneHourAgo, now);

    // when
    service.ofQuery(query, [], [], context);

    // then
    expect(dialogServiceOpenSpy).toHaveBeenCalled();
    const actualQuery: Query = dialogServiceOpenSpy.calls.argsFor(0)[1].data;
    expect(actualQuery.hasFullTextFilter()).toBeFalse();
    expect(actualQuery.getPropertyFilters()).toEqual([]);
    expect(actualQuery.getValueRangeFilters()).toEqual([
      new ValueRangeFilter('Time', { min: oneHourAgo, max: now, maxExcluding: undefined })
    ]);
  });

  it('#ofQuery should navigate to raw data view for base query and additional attributes', () => {

    // given
    query.setFullTextFilter('xyz');
    query.addPropertyFilter(new PropertyFilter('Host', Operator.NOT_EMPTY, ''));
    query.addPropertyFilter(new PropertyFilter('Path', Operator.CONTAINS, '.txt'));
    query.addValueRangeFilter('Time', oneHourAgo, now);
    const columnNames = ['Level', 'Amount'];
    const columnValues = ['WARN', 1000];

    // when
    service.ofQuery(query, columnNames, columnValues, context);

    // then
    expect(dialogServiceOpenSpy).toHaveBeenCalled();
    const actualQuery: Query = dialogServiceOpenSpy.calls.argsFor(0)[1].data;
    expect(actualQuery.getFullTextFilter()).toBe('xyz');
    expect(actualQuery.getPropertyFilters()).toEqual([
      new PropertyFilter('Host', Operator.NOT_EMPTY, ''),
      new PropertyFilter('Path', Operator.CONTAINS, '.txt'),
      new PropertyFilter('Level', Operator.EQUAL, 'WARN'),
      new PropertyFilter('Amount', Operator.EQUAL, 1000)
    ]);
    expect(actualQuery.getValueRangeFilters()).toEqual([
      new ValueRangeFilter('Time', { min: oneHourAgo, max: now, maxExcluding: undefined })
    ]);
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
