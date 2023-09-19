import { DatePipe } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, ElementRef, Injectable } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flush, tick, waitForAsync } from '@angular/core/testing';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By, HAMMER_LOADER } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { InputDialogComponent, InputDialogData } from 'app/shared/component/input-dialog/input-dialog.component';
import { Column, DataType, Query, Route, Scene, StatusType, TimeUnit } from 'app/shared/model';
import { ConfigRecord } from 'app/shared/model/view-config';
import { DialogService, ExportService, NotificationService, RawDataRevealService, TimeGroupingService, ViewPersistenceService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { CouchDBConstants } from 'app/shared/services/backend/couchdb/couchdb-constants';
import { SceneFactory } from 'app/shared/test';
import { NotificationServiceMock } from 'app/shared/test/notification-service-mock';
import { ValueRangeGroupingService } from 'app/shared/value-range';
import { ValueGrouping } from 'app/shared/value-range/model';
import { Observable, of } from 'rxjs';
import { PivotContext } from './model';
import { PivotTableComponent } from './pivot-table.component';

@Injectable()
export class MockElementRef {
  nativeElement: {}
}
describe('PivotTableComponent', () => {

  const NOW = new Date().getTime();
  const datePipe = new DatePipe('en-US');

  let now: number;
  let columns: Column[];
  let scene: Scene;
  let entries: object[];
  let component: PivotTableComponent;
  let fixture: ComponentFixture<PivotTableComponent>;
  const dbService = new DBService(null);
  const viewPersistenceService = new ViewPersistenceService(dbService);
  const dialogService = new DialogService(null);
  const notificationService = new NotificationServiceMock();
  const exportService = new ExportService();
  const rawDataRevealService = new RawDataRevealService(null, null);
  let locatePivotTable: Function;
  let getActiveSceneSpy: jasmine.Spy;

  beforeAll(() => {
    now = Date.now();
    columns = [
      { name: 'ID', dataType: DataType.NUMBER, width: 30, indexed: true },
      { name: 'Time', dataType: DataType.TIME, width: 100, groupingTimeUnit: TimeUnit.MINUTE, indexed: true },
      { name: 'Level', dataType: DataType.TEXT, width: 60, indexed: true },
      { name: 'Data', dataType: DataType.TEXT, width: 400, indexed: false },
      { name: 'Amount', dataType: DataType.NUMBER, width: 70, indexed: true }
    ];
    scene = SceneFactory.createScene('1', columns);
    entries = [
      { ID: 1, Time: now - 1000, Level: 'INFO', Data: 'one', Amount: 10 },
      { ID: 2, Time: now - 2000, Level: 'INFO', Data: 'two', Amount: 20 },
      { ID: 3, Time: now - 3000, Level: 'INFO', Data: 'three', Amount: 30 },
      { ID: 4, Time: now - 4000, Level: 'WARN', Data: 'four', Amount: 40 },
    ];
  });

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      declarations: [PivotTableComponent],
      imports: [
        MatSidenavModule, MatProgressBarModule, MatButtonModule, MatIconModule, MatTooltipModule,
        BrowserAnimationsModule, MatMenuModule, RouterTestingModule, MatBottomSheetModule
      ],
      providers: [
        { provide: ElementRef, useClass: MockElementRef },
        { provide: MatBottomSheet, useClass: MatBottomSheet },
        { provide: DBService, useValue: dbService },
        { provide: DialogService, useValue: dialogService },
        { provide: ViewPersistenceService, useValue: viewPersistenceService },
        { provide: TimeGroupingService, useClass: TimeGroupingService },
        { provide: ValueRangeGroupingService, useClass: ValueRangeGroupingService },
        { provide: NotificationService, useValue: notificationService },
        { provide: ExportService, useValue: exportService },
        { provide: RawDataRevealService, useValue: rawDataRevealService },
        { provide: HAMMER_LOADER, useValue: () => new Promise(() => { }) }
      ]
    }).compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(PivotTableComponent);
    component = fixture.componentInstance;
    locatePivotTable = () => component.divPivot.nativeElement.getElementsByClassName('pvtTable')[0];
    spyOn(notificationService, 'showStatus').and.stub();
    getActiveSceneSpy = spyOn(dbService, 'getActiveScene').and.returnValue(scene);
    spyOn(dbService, 'findEntries').and.returnValue(of(entries));
    fixture.detectChanges();
    flush();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.context).toBeTruthy();
  });

  it('#ngOnInit should navigate to scenes view when no scene is active', fakeAsync(() => {

    // given
    getActiveSceneSpy.and.returnValue(null);
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    // when
    component.ngOnInit();
    flush();

    // then
    expect(router.navigateByUrl).toHaveBeenCalledWith(Route.SCENES);
  }));

  it('should retain indexed columns from active scene', () => {
    expect(dbService.getActiveScene).toHaveBeenCalled();
    expect(component.columns.map(c => c.name)).toEqual(['ID', 'Time', 'Level', 'Amount']);
    expect(component.context.timeColumns).toEqual(
      [{ name: 'Time', dataType: DataType.TIME, width: 100, groupingTimeUnit: TimeUnit.MILLISECOND, indexed: true }]);
  });

  it('should fetch entries and build data frame', () => {
    const format = 'd MMM yyyy HH:mm:ss SSS';
    const expectedData = [
      { ID: 1, Level: 'INFO', Data: 'one', Amount: 10, Time: datePipe.transform(now - 1000, format) },
      { ID: 2, Level: 'INFO', Data: 'two', Amount: 20, Time: datePipe.transform(now - 2000, format) },
      { ID: 3, Level: 'INFO', Data: 'three', Amount: 30, Time: datePipe.transform(now - 3000, format) },
      { ID: 4, Level: 'WARN', Data: 'four', Amount: 40, Time: datePipe.transform(now - 4000, format) },
    ];
    expect(dbService.findEntries).toHaveBeenCalled();
    expect(component.dataFrame.toArray()).toEqual(expectedData);
  });

  it('#fetchData should not re-generate value groupings when not invoked first time', fakeAsync(() => {

    // given
    const valueGroupings: ValueGrouping[] = [
      {
        columnName: 'Amount',
        ranges: [
          { min: 30, max: 50, active: true },
          { min: 0, max: 30, active: true }
        ]
      }];
    component.context.valueGroupings = valueGroupings;

    // when
    component.fetchData(new Query());
    flush();

    // then
    expect(component.context.valueGroupings).toBe(valueGroupings);
  }));

  it('sidenav#close should leave data frame unchanged when value groupings did not change', fakeAsync(() => {

    // given
    const dataFrame = component.dataFrame;
    component.sidenav.open();
    fixture.detectChanges();
    flush();

    // when
    component.sidenav.close();
    fixture.detectChanges();

    // then
    flush();
    expect(component.dataFrame).toBe(dataFrame);
  }));

  it('sidenav#close should recreate data frame when value groupings changed', fakeAsync(() => {

    // given
    const dataFrame = component.dataFrame;
    component.sidenav.open();
    fixture.detectChanges();
    flush();
    component.context.valueGroupings = [
      {
        columnName: 'Amount',
        ranges: [
          { min: 30, max: 50, active: true },
          { min: 0, max: 30, active: true }
        ]
      }];

    // when
    component.sidenav.close();
    fixture.detectChanges();

    // then
    flush();
    expect(component.dataFrame).not.toBe(dataFrame);
  }));

  it('#onTimeUnitChanged should change selected time unit and refresh data', fakeAsync(() => {

    // given
    const timeColumn = component.context.timeColumns[0];

    // when
    component.onTimeUnitChanged(timeColumn, TimeUnit.YEAR);
    flush();

    // then
    const year = datePipe.transform(now, 'yyyy');
    const expectedData = [
      { ID: 1, Level: 'INFO', Data: 'one', Amount: 10, 'Time (per year)': year },
      { ID: 2, Level: 'INFO', Data: 'two', Amount: 20, 'Time (per year)': year },
      { ID: 3, Level: 'INFO', Data: 'three', Amount: 30, 'Time (per year)': year },
      { ID: 4, Level: 'WARN', Data: 'four', Amount: 40, 'Time (per year)': year }
    ]
    expect(timeColumn.groupingTimeUnit).toBe(TimeUnit.YEAR);
    expect(component.dataFrame.toArray()).toEqual(expectedData);
  }));

  it('#loadConfig should restore selected values from config', () => {

    // given
    const context: PivotContext = {
      timeColumns: [{ name: 'Time', dataType: DataType.TIME, width: 100, groupingTimeUnit: TimeUnit.MONTH }],
      negativeColor: 'yellow',
      positiveColor: 'red',
      showRowTotals: true,
      showColumnTotals: true,
      valueGroupings: [],
      pivotOptions: { a: 1, b: 2 }
    };
    const configRecord: ConfigRecord = { route: Route.PIVOT, name: 'test', modifiedTime: NOW, query: null, data: context };

    // when
    component.loadConfig(configRecord);

    // then
    expect(component.context.negativeColor).toBe('yellow');
    expect(component.context.positiveColor).toBe('red');
    expect(component.context.timeColumns[0].groupingTimeUnit).toBe(TimeUnit.MONTH);
  });

  it('#loadConfig should spice pivot options', () => {

    // given
    const context: PivotContext = {
      timeColumns: [{ name: 'Time', dataType: DataType.TIME, width: 100, groupingTimeUnit: TimeUnit.YEAR }],
      negativeColor: 'yellow',
      positiveColor: 'red',
      showRowTotals: true,
      showColumnTotals: true,
      valueGroupings: [],
      pivotOptions: { a: 1, b: 2 }
    };
    const configRecord: ConfigRecord = { route: Route.PIVOT, name: 'test', modifiedTime: NOW, query: null, data: context };

    // when
    component.loadConfig(configRecord);

    // then
    expect(component.context.timeColumns[0].groupingTimeUnit).toBe(TimeUnit.YEAR);
    expect(context.pivotOptions['hiddenAttributes']).toEqual([CouchDBConstants._ID]);
    expect(context.pivotOptions['rendererOptions']).not.toBeUndefined();
    expect(context.pivotOptions['onRefresh']).not.toBeUndefined();
  });

  it('#saveConfig should not save view when input dialog is cancled', () => {

    // given
    const dialogRef = createInputDialogRef();
    spyOn(dialogService, 'showInputDialog').and.callFake((data: InputDialogData) => {
      data.closedWithOK = false;
      return dialogRef;
    });
    spyOn(viewPersistenceService, 'saveRecord').and.returnValue(undefined);

    // when
    component.saveConfig();

    // then
    expect(notificationService.showStatus).not.toHaveBeenCalled();
  });

  it('#saveConfig should should save context without value grouping minMaxValues', fakeAsync(() => {

    // given
    component.context.valueGroupings = [
      {
        columnName: 'Amount',
        ranges: [
          { min: 30, max: 50, active: true },
          { min: 0, max: 30, active: true }
        ],
        minMaxValues: { min: 10, max: 40 }
      }];
    const dialogRef = createInputDialogRef();
    spyOn(dialogService, 'showInputDialog').and.callFake((data: InputDialogData) => {
      data.input = 'test';
      data.closedWithOK = true;
      return dialogRef;
    });
    const saveRecordSpy = spyOn(viewPersistenceService, 'saveRecord');
    const status = { type: StatusType.SUCCESS, msg: 'Data has been saved' };
    const status$ = Promise.resolve(status);
    saveRecordSpy.and.returnValue(status$);

    // when
    component.saveConfig();
    tick();

    // then
    expect(viewPersistenceService.saveRecord).toHaveBeenCalled();
    const context = saveRecordSpy.calls.mostRecent().args[4];
    const expectedValueGroupings = [
      {
        columnName: 'Amount',
        ranges: [
          { min: 30, max: 50, active: true },
          { min: 0, max: 30, active: true }
        ],
        minMaxValues: null
      }];
    expect(context.valueGroupings).toEqual(expectedValueGroupings);
  }));

  it('#saveConfig should notify user about success', fakeAsync(() => {

    // given
    const dialogRef = createInputDialogRef();
    spyOn(dialogService, 'showInputDialog').and.callFake((data: InputDialogData) => {
      data.input = 'test';
      data.closedWithOK = true;
      return dialogRef;
    });
    const status = { type: StatusType.SUCCESS, msg: 'Data has been saved' };
    const status$ = Promise.resolve(status);
    spyOn(viewPersistenceService, 'saveRecord').and.returnValue(status$);

    // when
    component.saveConfig();
    flush();

    // then
    const bootomSheet = TestBed.inject(MatBottomSheet);
    expect(notificationService.showStatus).toHaveBeenCalledWith(bootomSheet, status);
  }));

  it('#onNegativeColorChanged should not refresh pivot table when no heatmap', fakeAsync(() => {

    // given
    component.getPivotOptions()['rendererName'] = 'Table';
    const pivotTable = locatePivotTable();

    // when
    component.onNegativeColorChanged('yellow');
    flush();

    // then
    expect(component.context.negativeColor).toBe('yellow');
    expect(locatePivotTable()).toBe(pivotTable);
  }));

  it('#onNegativeColorChanged should refresh pivot table when heatmap', fakeAsync(() => {

    // given
    component.getPivotOptions()['rendererName'] = 'Row Heatmap';
    const pivotTable = locatePivotTable();

    // when
    component.onNegativeColorChanged('yellow');
    flush();

    // then
    expect(component.context.negativeColor).toBe('yellow');
    expect(locatePivotTable()).not.toBe(pivotTable);
  }));

  it('#onPositiveColorChanged should not refresh pivot table when no heatmap', fakeAsync(() => {

    // given
    component.getPivotOptions()['rendererName'] = 'Table';
    const pivotTable = locatePivotTable();

    // when
    component.onPositiveColorChanged('yellow');
    flush();

    // then
    expect(component.context.positiveColor).toBe('yellow');
    expect(locatePivotTable()).toBe(pivotTable);
  }));

  it('#onPositiveColorChanged should refresh pivot table when heatmap', fakeAsync(() => {

    // given
    component.getPivotOptions()['rendererName'] = 'Col Heatmap';
    const pivotTable = locatePivotTable();

    // when
    component.onPositiveColorChanged('yellow');
    flush();

    // then
    expect(component.context.positiveColor).toBe('yellow');
    expect(locatePivotTable()).not.toBe(pivotTable);
  }));

  it('#onShowRowTotalsChanged should refresh pivot table', fakeAsync(() => {

    // given
    const pivotTable = locatePivotTable();

    // when
    component.onShowRowTotalsChanged();
    flush();

    // then
    expect(component.context.showRowTotals).toBeFalse();
    expect(locatePivotTable()).not.toBe(pivotTable);
  }));

  it('#onShowColumnTotalsChanged should refresh pivot table', fakeAsync(() => {

    // given
    const pivotTable = locatePivotTable();

    // when
    component.onShowColumnTotalsChanged();
    flush();

    // then
    expect(component.context.showColumnTotals).toBeFalse();
    expect(locatePivotTable()).not.toBe(pivotTable);
  }));

  it('#exportToExcel should export pivot table to Excel', () => {

    // given
    spyOn(exportService, 'exportTableAsExcel').and.stub();

    // when
    component.exportToExcel();

    // then
    expect(exportService.exportTableAsExcel).toHaveBeenCalledWith(jasmine.any(Object), 'PivotTable');
  });

  it('#click on print button should print window', fakeAsync(() => {

    // given;
    const okButton: HTMLSelectElement = fixture.debugElement.query(By.css('#but_print')).nativeElement;
    spyOn(window, 'print');

    // when
    okButton.click();

    // then
    expect(window.print).toHaveBeenCalled();
  }));

  function createInputDialogRef(): MatDialogRef<InputDialogComponent> {
    return <MatDialogRef<InputDialogComponent>>{
      afterClosed(): Observable<boolean> {
        return of(true);
      }
    };
  }
});
