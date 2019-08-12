import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { MatTableModule, MatSortModule, MatProgressBarModule, MatDialogModule, MatDialog } from '@angular/material';
import { of } from 'rxjs';
import { SummaryTableComponent } from './summary-table.component';
import { SummaryContext, Query, Route, Column, DataType, Scene, TimeUnit, Aggregation } from 'app/shared/model';
import { AggregationService, ValueRangeGroupingService, RawDataRevealService } from 'app/shared/services';
import { DatePipe } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { SimpleChange } from '@angular/core';
import { DBService } from 'app/shared/services/backend';
import { SceneFactory } from 'app/shared/test';

describe('SummaryTableComponent', () => {

  const ts = Number(1000).toLocaleString().charAt(1); // Thousands separator
  let now: number;
  const sec = 1_000;

  let context: SummaryContext;
  let columns: Column[];
  let entries: Object[];

  let component: SummaryTableComponent;
  let fixture: ComponentFixture<SummaryTableComponent>;
  let router: Router;
  const dbService = new DBService(null);
  const datePipe = new DatePipe('en-US');

  beforeAll(() => {
    const date = new Date();
    date.setMilliseconds(0);
    date.setSeconds(0);
    now = date.getTime();
    columns = [
      { name: 'Time', dataType: DataType.TIME, width: 100, groupingTimeUnit: TimeUnit.MINUTE, indexed: true },
      { name: 't1', dataType: DataType.TEXT, width: 60, indexed: true },
      { name: 'n1', dataType: DataType.NUMBER, width: 80, indexed: true },
      { name: 't2', dataType: DataType.TEXT, width: 200, indexed: true },
      { name: 'n2', dataType: DataType.NUMBER, width: 70, indexed: true }
    ];
    entries = [
      { Time: now, /*      */ t1: 'a', n1: 1, t2: null, n2: null },
      { Time: now + 30 * sec, t1: 'b', n1: 2, t2: 'x', n2: 8 },
      { Time: now + 70 * sec, t1: 'b', n1: 3, t2: 'y', n2: 9 },
      { Time: now + 80 * sec, t1: 'b', n1: 2, t2: 'x', n2: 9 }
    ];
    spyOn(dbService, 'getActiveScene').and.returnValue(SceneFactory.createScene('1', columns));
  });

  beforeEach(() => {
    router = <Router> { navigateByUrl: (url: string) => null };
    const rawDataRevealService = new RawDataRevealService(router, <MatDialog> {});
    rawDataRevealService.setUseDialog(false);
    TestBed.configureTestingModule({
      imports: [MatTableModule, MatSortModule, MatProgressBarModule, RouterTestingModule, MatDialogModule],
      declarations: [SummaryTableComponent],
      providers: [
        { provide: DBService, useValue: dbService },
        { provide: AggregationService, useClass: AggregationService },
        { provide: ValueRangeGroupingService, useClass: ValueRangeGroupingService },
        { provide: RawDataRevealService, useValue: rawDataRevealService }
      ]
    })
    fixture = TestBed.createComponent(SummaryTableComponent);
    component = fixture.componentInstance;
    context = new SummaryContext(columns);
    context.dataColumns = [findColumn('t2')];
    component.context = context;
    component.entries$ = of(entries.slice(0));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should refresh component each time context changes', fakeAsync(() => {

    // given
    fixture.detectChanges();
    flush();
    spyOn(component, 'refreshDataFrameAsync');

    // when
    context.dataColumns = [findColumn('t1')];
    context.groupByColumns = [findColumn('Time')];
    flush();

    // then
    expect(component.refreshDataFrameAsync).toHaveBeenCalledTimes(2);
  }));

  it('#ngOnInit should not adjust size when inside grid view and context size changes', fakeAsync(() => {

    // given
    component.gridView = true;
    context.setSize(500, 400);

    // when
    fixture.detectChanges();
    flush();

    // then
    const divContent = component.divContentRef.nativeElement;
    expect(divContent.style.maxWidth).toBe('');
    expect(divContent.style.maxHeight).toBe('');
  }));

  it('#ngOnInit should adjust size when not inside grid view and context size changes', fakeAsync(() => {

    // given
    component.gridView = false;
    context.setSize(500, 400);

    // when
    fixture.detectChanges();
    flush();

    // then
    const divContent = component.divContentRef.nativeElement;
    expect(divContent.style.maxWidth).toBe('500px');
    expect(divContent.style.maxHeight).toBe('400px');
  }));

  it('#ngOnInit should not adjust width when inside grid view and context has unlimited width', fakeAsync(() => {

    // given
    component.gridView = false;

    // when
    fixture.detectChanges();
    flush();

    // then
    const divContent = component.divContentRef.nativeElement;
    expect(divContent.style.maxWidth).toBe('');
  }));

  it('#ngOnChanges should refresh frame data when entries$ changed', fakeAsync(() => {

    // given
    fixture.detectChanges();
    flush();
    const prevFrameData = component.frameData;
    const entries$ = of(entries.slice(0, 1));
    component.entries$ = entries$;

    // when
    component.ngOnChanges({ entries$: new SimpleChange(null, entries$, false) });
    flush();

    // then
    expect(component.frameData).toBeTruthy();
    expect(component.frameData.length).toBe(1);
    expect(component.frameData).not.toBe(prevFrameData);
  }));

  it('should create summary data', fakeAsync(() => {

    // given
    context.dataColumns = [findColumn('t1')];
    context.groupByColumns = [findColumn('Time')];

    // when
    fixture.detectChanges();
    flush();

    // then
    const expected = [
      { 'Time (per minute)': now, t1: 'a', Count: 1 },
      { 'Time (per minute)': now, t1: 'b', Count: 1 },
      { 'Time (per minute)': now + 60 * sec, t1: 'b', Count: 2 }
    ];
    expect(component.frameData).toEqual(expected);
  }));

  it('should compute row spans', fakeAsync(() => {

    // given
    context.dataColumns = [findColumn('t2')];
    context.groupByColumns = [findColumn('t1')];

    // when
    fixture.detectChanges();
    flush();

    // then
    const expected = [
      [{ span: 2 }, { span: 0 }, { span: 1 }],
      [{ span: 1 }, { span: 1 }, { span: 1 }]
    ];
    expect(component.rowSpans).toEqual(expected);
  }));

  it('should refresh data frame when context changes', fakeAsync(() => {

    // given
    context.dataColumns = [findColumn('t1')];
    fixture.detectChanges();
    flush();
    const prevFrameData = component.frameData;
    expect(prevFrameData).toBeTruthy();

    // when
    context.dataColumns = [findColumn('t2')];
    flush();

    // then
    expect(component.frameData).not.toBe(prevFrameData);
  }));

  it('should not refresh data frame when context size changes', fakeAsync(() => {

    // given
    context.dataColumns = [findColumn('t1')];
    fixture.detectChanges();
    flush();
    const prevFrameData = component.frameData;
    expect(prevFrameData).toBeTruthy();

    // when
    context.setSize(155, 198);
    flush();

    // then
    expect(component.frameData).toBe(prevFrameData);
  }));

  it('#onAggregationCellClick should open raw data view for matching columns', () => {

    // given
    context.dataColumns = [findColumn('t1')];
    context.groupByColumns = [findColumn('t2')];
    context.query = new Query();
    spyOn(router, 'navigateByUrl').and.returnValue(null);

    // when
    component.onAggregationCellClick({ t1: 'a', t2: 'x', 'Count': 522 });

    // then
    expect(router.navigateByUrl).toHaveBeenCalledWith('/' + Route.RAWDATA + '?t2=x&t1=a');
  });

  it('#onAggregationCellClick should open raw data view for matching column and time period', () => {

    // given
    context.dataColumns = [findColumn('t1')];
    context.groupByColumns = [findColumn('Time')];
    context.query = new Query();
    const oneMinuteAgo = now - 60 * sec;
    spyOn(router, 'navigateByUrl').and.returnValue(null);

    // when
    component.onAggregationCellClick({ 'Time (per minute)': oneMinuteAgo, t1: 'a', 'Count': 522 });

    // then
    expect(router.navigateByUrl).toHaveBeenCalledWith('/' + Route.RAWDATA + '?t1=a&Time_gte=' + oneMinuteAgo + '&Time_lte=' + now);
  });

  it('#sort should sort ascending', fakeAsync(() => {

    // given
    context.dataColumns = [findColumn('n1')];
    fixture.detectChanges();
    flush();

    // when
    component.sort({ active: 'n1', direction: 'asc' });
    flush();

    // then
    const expected = [
      { n1: 1, Count: 1 },
      { n1: 2, Count: 2 },
      { n1: 3, Count: 1 }
    ];
    expect(component.frameData).toEqual(expected);
  }));

  it('#sort should sort descending', fakeAsync(() => {

    // given
    context.dataColumns = [findColumn('n1')];
    fixture.detectChanges();
    flush();

    // when
    component.sort({ active: 'n1', direction: 'desc' });
    flush();

    // then
    const expected = [
      { n1: 3, Count: 1 },
      { n1: 2, Count: 2 },
      { n1: 1, Count: 1 }
    ];
    expect(component.frameData).toEqual(expected);
  }));

  it('#formattedValueOf should return blank when data is being computed', fakeAsync(() => {

    // given
    context.dataColumns = [findColumn('n1')];
    fixture.detectChanges();
    flush();
    component.computing = true;

    // when
    const formattedValue = component.formattedValueOf(0, -1_000_000.5);

    // then
    expect(formattedValue).toBe('');
  }));

  it('#formattedValueOf should return formatted number when non-grouped value is number', fakeAsync(() => {

    // given
    context.dataColumns = [findColumn('n1')];
    fixture.detectChanges();
    flush();

    // when
    const formattedValue = component.formattedValueOf(0, -1_000_000.5);

    // then
    expect(formattedValue).toBe('-1' + ts + '000' + ts + '000.5');
  }));

  it('#formattedValueOf should return formatted number grouped value is number', fakeAsync(() => {

    // given
    context.dataColumns = [findColumn('t1')];
    context.groupByColumns = [findColumn('n1')];
    fixture.detectChanges();
    flush();

    // when
    const formattedValue = component.formattedValueOf(0, -1_000_000.5);

    // then
    expect(formattedValue).toBe('-1' + ts + '000' + ts + '000.5');
  }));


  it('#formattedValueOf should return formatted time when group value is time', fakeAsync(() => {

    // given
    context.dataColumns = [findColumn('t1')];
    context.groupByColumns = [findColumn('Time')];
    fixture.detectChanges();
    flush();

    // when
    const formattedValue = component.formattedValueOf(0, now);

    // then
    expect(formattedValue).toBe(datePipe.transform(now, 'd MMM yyyy HH:mm'));
  }));

  it('#createExportData should return data when aggregated by COUNT', fakeAsync(() => {

    // given
    context.dataColumns = [findColumn('t1')];
    context.groupByColumns = [findColumn('Time')];
    fixture.detectChanges();
    flush();

    // when
    const data = component.createExportData();

    // then
    const timeFormat = 'd MMM yyyy HH:mm';
    const expectedData = [
      { 'Time (per minute)': datePipe.transform(now, timeFormat), t1: 'a', Count: 1 },
      { 'Time (per minute)': datePipe.transform(now, timeFormat), t1: 'b', Count: 1 },
      { 'Time (per minute)': datePipe.transform(now + 60 * sec, timeFormat), t1: 'b', Count: 2 },
      { 'Time (per minute)': '', t1: 'Overall', Count: 4 }
    ];
    expect(data).toEqual(expectedData);
  }));

  it('#createExportData should return data when aggregated by MIN, MAX and SUM', fakeAsync(() => {

    // given
    context.dataColumns = [findColumn('n1')];
    context.groupByColumns = [findColumn('t1')];
    context.aggregations = [Aggregation.MIN, Aggregation.MAX, Aggregation.SUM];
    fixture.detectChanges();
    flush();

    // when
    const data = component.createExportData();

    // then
    const expectedData = [
      { t1: 'a', Min: 1, Max: 1, Sum: 1 },
      { t1: 'b', Min: 2, Max: 3, Sum: 7 },
      { t1: 'Overall', Min: 1, Max: 3, Sum: 8 },
    ];
    expect(data).toEqual(expectedData);
  }));

  function findColumn(name: string): Column {
    return columns.find(c => c.name === name);
  }
});
