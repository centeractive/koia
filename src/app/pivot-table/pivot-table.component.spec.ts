import { async, ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';

import { PivotTableComponent } from './pivot-table.component';
import { ElementRef, Injectable, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NotificationService, ExportService, ValueRangeGroupingService, TimeGroupingService, DialogService } from 'app/shared/services';
import { of, Observable } from 'rxjs';
import {
  MatSidenavModule, MatProgressBarModule, MatButtonModule, MatIconModule, MatTooltipModule, MatMenuModule,
  MatBottomSheet,
  MatDialogRef
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StatusType, PivotContext, Column, DataType, Scene, TimeUnit, Route } from 'app/shared/model';
import { HAMMER_LOADER, By } from '@angular/platform-browser';
import { DatePipe } from '@angular/common';
import { DBService } from 'app/shared/services/backend';
import { ViewPersistenceService } from 'app/shared/services';
import { RouterTestingModule } from '@angular/router/testing';
import { CouchDBConstants } from 'app/shared/services/backend/couchdb/couchdb-constants';
import { NotificationServiceMock } from 'app/shared/test/notification-service-mock';
import { SceneFactory } from 'app/shared/test';
import { ConfigRecord } from 'app/shared/model/view-config';
import { InputDialogComponent, InputDialogData } from 'app/shared/component/input-dialog/input-dialog.component';

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
  let entries: Object[];
  let component: PivotTableComponent;
  let fixture: ComponentFixture<PivotTableComponent>;
  const dbService = new DBService(null);
  const viewPersistenceService = new ViewPersistenceService(dbService);
  const dialogService = new DialogService(null);
  const notificationService = new NotificationServiceMock();
  const exportService = new ExportService();
  let locatePivotTable: Function;

  beforeAll(() => {
    now = new Date().getTime();
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

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      declarations: [PivotTableComponent],
      imports: [
        MatSidenavModule, MatProgressBarModule, MatButtonModule, MatIconModule, MatTooltipModule,
        BrowserAnimationsModule, MatMenuModule, RouterTestingModule
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
        { provide: HAMMER_LOADER, useValue: () => new Promise(() => { }) }
      ]
    }).compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(PivotTableComponent);
    component = fixture.componentInstance;
    locatePivotTable = () => component.divPivot.nativeElement.getElementsByClassName('pvtTable')[0];
    spyOn(notificationService, 'showStatus').and.stub();
    spyOn(dbService, 'getActiveScene').and.returnValue(scene);
    spyOn(dbService, 'findEntries').and.returnValue(of(entries));
    fixture.detectChanges();
    flush();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.context).toBeTruthy();
  });

  it('should retain indexed columns from active scene', () => {
    expect(dbService.getActiveScene).toHaveBeenCalled();
    expect(component.columns.map(c => c.name)).toEqual(['ID', 'Time', 'Level', 'Amount']);
    expect(component.context.timeColumns).toEqual(
      [{ name: 'Time', dataType: DataType.TIME, width: 100, groupingTimeUnit: TimeUnit.MILLISECOND, indexed: true }]);
  });

  it('should fetch entries and build data frame', fakeAsync(() => {
    const format = 'd MMM yyyy HH:mm:ss SSS';
    const expectedData = [
      { ID: 1, Level: 'INFO', Data: 'one', Amount: 10, Time: datePipe.transform(now - 1000, format) },
      { ID: 2, Level: 'INFO', Data: 'two', Amount: 20, Time: datePipe.transform(now - 2000, format) },
      { ID: 3, Level: 'INFO', Data: 'three', Amount: 30, Time: datePipe.transform(now - 3000, format) },
      { ID: 4, Level: 'WARN', Data: 'four', Amount: 40, Time: datePipe.transform(now - 4000, format) },
    ]
    expect(dbService.findEntries).toHaveBeenCalled();
    expect(component.dataFrame.toArray()).toEqual(expectedData);
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
    const configRecord: ConfigRecord = { route: Route.PIVOT, name: 'test', modifiedTime: NOW, data: context };

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
    const configRecord: ConfigRecord = { route: Route.PIVOT, name: 'test', modifiedTime: NOW, data: context };

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

  it('#saveConfig should notify user about success', fakeAsync(() => {

    // given
    const dialogRef = createInputDialogRef();
    spyOn(dialogService, 'showInputDialog').and.callFake((data: InputDialogData) => {
      data.input = 'test';
      data.closedWithOK = true;
      return dialogRef;
    });
    const status = { type: StatusType.SUCCESS, msg: 'Data has been saved' };
    const status$ = of(status).toPromise();
    spyOn(viewPersistenceService, 'saveRecord').and.returnValue(status$);

    // when
    component.saveConfig();
    tick();

    // then
    const bootomSheet = TestBed.get(MatBottomSheet);
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
    expect(component.context.showRowTotals).toBeFalsy();
    expect(locatePivotTable()).not.toBe(pivotTable);
  }));

  it('#onShowColumnTotalsChanged should refresh pivot table', fakeAsync(() => {

    // given
    const pivotTable = locatePivotTable();

    // when
    component.onShowColumnTotalsChanged();
    flush();

    // then
    expect(component.context.showColumnTotals).toBeFalsy();
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

  it('#adjustLayout should adjust content margin top', () => {

    // given
    const divHeader = { offsetHeight: 55 };
    component.divHeaderRef = new ElementRef(<HTMLDivElement>divHeader);
    const divContent = { style: { marginTop: '' } };
    component.divContentRef = new ElementRef(<HTMLDivElement>divContent);

    // when
    component.adjustLayout();

    // then
    expect(divContent.style.marginTop).toEqual((55 + PivotTableComponent.MARGIN_TOP) + 'px');
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
