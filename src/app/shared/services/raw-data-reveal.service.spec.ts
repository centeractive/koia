import { TestBed } from '@angular/core/testing';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RawDataDialogComponent } from 'app/raw-data/raw-data-dialog.component';
import { Column, ComputeOperator, DataType, ElementContext, Operator, PropertyFilter, Query, SummaryContext, TimeUnit } from '../model';
import { ValueRangeFilter } from '../value-range/model';
import { CouchDBConstants } from './backend/couchdb';
import { NotificationService } from './notification.service';
import { RawDataRevealService } from './raw-data-reveal.service';
import type { Mock } from 'vitest';

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
  let dialogServiceOpenSpy: Mock;

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
    dialogServiceOpenSpy = vi.spyOn(dialogService, 'open').mockReturnValue(null);
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
      maxWidth: 'calc(100vw - 40px)',
      enterAnimationDuration: 1,
      exitAnimationDuration: 1
    });
  });

  it('#ofID should navigate to raw data view with ID', () => {

    // when
    service.ofID('100');

    // then
    expect(dialogServiceOpenSpy).toHaveBeenCalled();
    const actualQuery: Query = vi.mocked(dialogServiceOpenSpy).mock.calls[0][1].data;
    expect(actualQuery.getPropertyFilters()).toEqual([new PropertyFilter(CouchDBConstants._ID, Operator.EQUAL, '100', DataType.TEXT)]);
    expect(actualQuery.getValueRangeFilters()).toEqual([]);
  });

  it('#ofTimeUnit should navigate to raw data view for time period of entire time unit without start of next time unit', () => {

    // when
    service.ofTimeUnit(context.query, [timeColumn], [oneHourAgo], ['Level'], ['ERROR'], context);

    // then
    expect(dialogServiceOpenSpy).toHaveBeenCalled();
    const actualQuery: Query = vi.mocked(dialogServiceOpenSpy).mock.calls[0][1].data;
    expect(actualQuery.getPropertyFilters()).toEqual([new PropertyFilter('Level', Operator.EQUAL, 'ERROR', DataType.TEXT)]);
    expect(actualQuery.getValueRangeFilters()).toEqual([
      new ValueRangeFilter('Time', { min: oneHourAgo, max: oneHourAgo + min, maxExcluding: true })
    ]);
  });

  it('#ofTimeUnit should navigate to raw data view for exact time when time column is not grouped', () => {

    // given
    timeColumn.groupingTimeUnit = undefined;

    // when
    service.ofTimeUnit(context.query, [timeColumn], [oneHourAgo], ['Level'], ['ERROR'], context);

    // then
    expect(dialogServiceOpenSpy).toHaveBeenCalled();
    const actualQuery: Query = vi.mocked(dialogServiceOpenSpy).mock.calls[0][1].data;
    expect(actualQuery.getPropertyFilters()).toEqual([new PropertyFilter('Level', Operator.EQUAL, 'ERROR', DataType.TEXT)]);
    expect(actualQuery.getValueRangeFilters()).toEqual([
      new ValueRangeFilter('Time', { min: oneHourAgo, max: oneHourAgo, maxExcluding: undefined })
    ]);
  });

  it('#ofTimeUnit should navigate to raw data view for empty time when start time of grouped time column is missing', () => {

    // when
    service.ofTimeUnit(context.query, [timeColumn], [undefined], ['Level'], ['ERROR'], context);

    // then
    expect(dialogServiceOpenSpy).toHaveBeenCalled();
    const actualQuery: Query = vi.mocked(dialogServiceOpenSpy).mock.calls[0][1].data;
    expect(actualQuery.getPropertyFilters()).toEqual([
      new PropertyFilter('Time', Operator.EMPTY, '', DataType.TIME),
      new PropertyFilter('Level', Operator.EQUAL, 'ERROR', DataType.TEXT)
    ]);
    expect(actualQuery.getValueRangeFilters()).toEqual([]);
  });

  it('#ofTimeUnit should navigate to raw data view for empty time when start time of ungrouped time column is null', () => {

    // given
    timeColumn.groupingTimeUnit = undefined;

    // when
    service.ofTimeUnit(context.query, [timeColumn], [null], ['Level'], ['ERROR'], context);

    // then
    expect(dialogServiceOpenSpy).toHaveBeenCalled();
    const actualQuery: Query = vi.mocked(dialogServiceOpenSpy).mock.calls[0][1].data;
    expect(actualQuery.getPropertyFilters()).toEqual([
      new PropertyFilter('Time', Operator.EMPTY, '', DataType.TIME),
      new PropertyFilter('Level', Operator.EQUAL, 'ERROR', DataType.TEXT)
    ]);
    expect(actualQuery.getValueRangeFilters()).toEqual([]);
  });

  it('#ofTimeUnit should navigate to raw data view for time period of trimmed timeunit', () => {

    // given
    timeColumn.groupingTimeUnit = TimeUnit.HOUR;
    query.addValueRangeFilter('Time', oneHourAgo + min, now - min);

    // when
    service.ofTimeUnit(context.query, [timeColumn], [oneHourAgo], ['Host'], ['server1'], context);

    // then
    expect(dialogServiceOpenSpy).toHaveBeenCalled();
    const actualQuery: Query = vi.mocked(dialogServiceOpenSpy).mock.calls[0][1].data;
    expect(actualQuery.getPropertyFilters()).toEqual([new PropertyFilter('Host', Operator.EQUAL, 'server1', DataType.TEXT)]);
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
    const actualQuery: Query = vi.mocked(dialogServiceOpenSpy).mock.calls[0][1].data;
    expect(actualQuery.getPropertyFilters()).toEqual([new PropertyFilter('Host', Operator.EQUAL, 'server1', DataType.TEXT)]);
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
    const actualQuery: Query = vi.mocked(dialogServiceOpenSpy).mock.calls[0][1].data;
    expect(actualQuery.getPropertyFilters()).toEqual([new PropertyFilter('Host', Operator.EQUAL, 'server1', DataType.TEXT)]);
    expect(actualQuery.getValueRangeFilters()).toEqual([
      new ValueRangeFilter('Time', { min: now - min, max: now, maxExcluding: true })
    ]);
  });

  it('#ofTimeUnit should exclude start of next time unit when base query time range ends there', () => {

    // given
    timeColumn.groupingTimeUnit = TimeUnit.HOUR;
    query.addValueRangeFilter('Time', oneHourAgo, now);

    // when
    service.ofTimeUnit(context.query, [timeColumn], [oneHourAgo], ['Host'], ['server1'], context);

    // then
    expect(dialogServiceOpenSpy).toHaveBeenCalled();
    const actualQuery: Query = vi.mocked(dialogServiceOpenSpy).mock.calls[0][1].data;
    expect(actualQuery.getValueRangeFilters()).toEqual([
      new ValueRangeFilter('Time', { min: oneHourAgo, max: now, maxExcluding: true })
    ]);
  });

  it('#ofQuery should navigate to raw data view for query', () => {

    // when
    service.ofQuery(query, [], [], context);

    // then
    expect(dialogServiceOpenSpy).toHaveBeenCalled();
    const actualQuery: Query = vi.mocked(dialogServiceOpenSpy).mock.calls[0][1].data;
    expect(actualQuery.hasFilter()).toBe(false);
  });

  it('#ofQuery should should navigate to raw data dialog with full text filter', () => {

    // given
    query.setFullTextFilter('abc');

    // when
    service.ofQuery(query, [], [], context);

    // then
    expect(dialogServiceOpenSpy).toHaveBeenCalled();
    const actualQuery: Query = vi.mocked(dialogServiceOpenSpy).mock.calls[0][1].data;
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
    const actualQuery: Query = vi.mocked(dialogServiceOpenSpy).mock.calls[0][1].data;
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
    const actualQuery: Query = vi.mocked(dialogServiceOpenSpy).mock.calls[0][1].data;
    expect(actualQuery.hasFullTextFilter()).toBe(false);
    expect(actualQuery.getPropertyFilters()).toEqual([new PropertyFilter('Level', Operator.EQUAL, 'ERROR', DataType.TEXT)]);
    expect(actualQuery.getValueRangeFilters()).toEqual([]);
  });

  it('#ofQuery should navigate to raw data view for single time range filter', () => {

    // when
    service.ofQuery(query, ['Time'], [now], context);

    // then
    expect(dialogServiceOpenSpy).toHaveBeenCalled();
    const actualQuery: Query = vi.mocked(dialogServiceOpenSpy).mock.calls[0][1].data;
    expect(actualQuery.hasFullTextFilter()).toBe(false);
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
    const actualQuery: Query = vi.mocked(dialogServiceOpenSpy).mock.calls[0][1].data;
    expect(actualQuery.hasFullTextFilter()).toBe(false);
    expect(actualQuery.getPropertyFilters()).toEqual([
      new PropertyFilter('Host', Operator.EQUAL, 'Server', DataType.TEXT),
      new PropertyFilter('Path', Operator.EQUAL, '/opt/tomcat/log/catalina.log', DataType.TEXT),
      new PropertyFilter('Level', Operator.EQUAL, 'ERROR', DataType.TEXT)
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
    const actualQuery: Query = vi.mocked(dialogServiceOpenSpy).mock.calls[0][1].data;
    expect(actualQuery.hasFullTextFilter()).toBe(false);
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
    const actualQuery: Query = vi.mocked(dialogServiceOpenSpy).mock.calls[0][1].data;
    expect(actualQuery.getFullTextFilter()).toBe('xyz');
    expect(actualQuery.getPropertyFilters()).toEqual([
      new PropertyFilter('Host', Operator.NOT_EMPTY, ''),
      new PropertyFilter('Path', Operator.CONTAINS, '.txt'),
      new PropertyFilter('Level', Operator.EQUAL, 'WARN', DataType.TEXT),
      new PropertyFilter('Amount', Operator.EQUAL, 1000, DataType.NUMBER)
    ]);
    expect(actualQuery.getValueRangeFilters()).toEqual([
      new ValueRangeFilter('Time', { min: oneHourAgo, max: now, maxExcluding: undefined })
    ]);
  });

  it('#ofQuery should show warning instead of raw data dialog when computed column is involved', () => {

    // given
    const onWarningSpy = vi.spyOn(TestBed.inject(NotificationService), 'onWarning').mockReturnValue(undefined);
    context = new SummaryContext([levelColumn, amountColumn, shareColumn()]);

    // when
    service.ofQuery(query, ['Level', 'Share'], ['WARN', 17.86], context);

    // then
    expect(onWarningSpy).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet),
      'Raw data cannot be revealed by values of the computed column "Share"');
    expect(dialogServiceOpenSpy).not.toHaveBeenCalled();
  });

  it('#ofQuery should show raw data dialog when no computed column is involved', () => {

    // given
    const onWarningSpy = vi.spyOn(TestBed.inject(NotificationService), 'onWarning').mockReturnValue(undefined);
    context = new SummaryContext([levelColumn, amountColumn, shareColumn()]);

    // when
    service.ofQuery(query, ['Level'], ['WARN'], context);

    // then
    expect(onWarningSpy).not.toHaveBeenCalled();
    expect(dialogServiceOpenSpy).toHaveBeenCalled();
  });

  it('#ofTimeUnit should show warning instead of raw data dialog when computed column is involved', () => {

    // given
    const onWarningSpy = vi.spyOn(TestBed.inject(NotificationService), 'onWarning').mockReturnValue(undefined);
    context = new SummaryContext([timeColumn, amountColumn, shareColumn()]);

    // when
    service.ofTimeUnit(query, [timeColumn], [oneHourAgo], ['Share'], [17.86], context);

    // then
    expect(onWarningSpy).toHaveBeenCalled();
    expect(dialogServiceOpenSpy).not.toHaveBeenCalled();
  });

  it('#ofQuery should create equal filter with data type of number column', () => {

    // when
    service.ofQuery(query, ['Amount'], [1234.5], context);

    // then
    const actualQuery: Query = vi.mocked(dialogServiceOpenSpy).mock.calls[0][1].data;
    expect(actualQuery.getPropertyFilters()).toEqual([new PropertyFilter('Amount', Operator.EQUAL, 1234.5, DataType.NUMBER)]);
  });

  it('#ofQuery should create empty filter for undefined value', () => {

    // when
    service.ofQuery(query, ['Level'], [undefined], context);

    // then
    const actualQuery: Query = vi.mocked(dialogServiceOpenSpy).mock.calls[0][1].data;
    expect(actualQuery.getPropertyFilters()).toEqual([new PropertyFilter('Level', Operator.EMPTY, '', DataType.TEXT)]);
  });

  it('#ofQuery should create empty filter for null value', () => {

    // when
    service.ofQuery(query, ['Amount'], [null], context);

    // then
    const actualQuery: Query = vi.mocked(dialogServiceOpenSpy).mock.calls[0][1].data;
    expect(actualQuery.getPropertyFilters()).toEqual([new PropertyFilter('Amount', Operator.EMPTY, '', DataType.NUMBER)]);
  });

  it('#ofQuery should create empty filter for empty string', () => {

    // when
    service.ofQuery(query, ['Host'], [''], context);

    // then
    const actualQuery: Query = vi.mocked(dialogServiceOpenSpy).mock.calls[0][1].data;
    expect(actualQuery.getPropertyFilters()).toEqual([new PropertyFilter('Host', Operator.EMPTY, '', DataType.TEXT)]);
  });

  function shareColumn(): Column {
    return {
      name: 'Share', dataType: DataType.NUMBER, width: 10, indexed: false,
      computation: { leftColumn: 'Amount', operator: ComputeOperator.PERCENTAGE, rightColumn: 'Amount' }
    };
  }

  function createColumn(name: string, dataType: DataType, timeUnit?: TimeUnit): Column {
    return {
      name: name,
      dataType: dataType,
      width: 10,
      groupingTimeUnit: timeUnit
    };
  }
});
