import { ComponentFixture, TestBed, flush, fakeAsync, waitForAsync } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, ElementRef } from '@angular/core';
import { RawDataComponent } from './raw-data.component';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Column, Query, DataType, Scene, Route, ExportFormat } from 'app/shared/model';
import { HAMMER_LOADER, By } from '@angular/platform-browser';
import { DBService } from 'app/shared/services/backend';
import { RouterTestingModule } from '@angular/router/testing';
import { NotificationService, DialogService, ExportService } from 'app/shared/services';
import { SceneFactory } from 'app/shared/test';
import { NotificationServiceMock } from 'app/shared/test/notification-service-mock';
import { SortLimitationWorkaround } from 'app/shared/services/backend/couchdb';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';

describe('RawDataComponent', () => {

  let now: number;
  let scene: Scene;
  let entries: Object[];
  let component: RawDataComponent;
  let fixture: ComponentFixture<RawDataComponent>;
  const dbService: DBService = new DBService(null);
  let getActiveSceneSpy: jasmine.Spy;
  const dialogService = new DialogService(null);
  const notificationService = new NotificationServiceMock();
  let exportService: ExportService;
  let requestEntriesPageSpy: jasmine.Spy;

  beforeAll(() => {
    now = new Date().getTime();
    const columns = [
      { name: 'Time', dataType: DataType.TIME, width: 100, format: 'yyyy-MM-dd HH:mm:ss SSS' },
      { name: 'Level', dataType: DataType.TEXT, width: 60 },
      { name: 'Data', dataType: DataType.TEXT, width: 500 },
      { name: 'Host', dataType: DataType.TEXT, width: 80 },
      { name: 'Path', dataType: DataType.TEXT, width: 200 },
      { name: 'Amount', dataType: DataType.NUMBER, width: 70 }
    ];
    scene = SceneFactory.createScene('1', columns);
    entries = [
      { ID: 1, Time: now - 1000, Level: 'INFO', Data: 'INFO line one', Host: 'server1', Path: '/opt/log/info.log', Amount: 10 },
      { ID: 2, Time: now - 2000, Level: 'INFO', Data: 'INFO line two', Host: 'server1', Path: '/opt/log/info.log', Amount: 20 },
      { ID: 3, Time: now - 3000, Level: 'INFO', Data: 'INFO line three', Host: 'server1', Path: '/opt/log/info.log', Amount: 30 },
      { ID: 4, Time: now - 4000, Level: 'WARN', Data: 'WARN line one', Host: 'local drive', Path: 'C:/temp/log/warn.log', Amount: 40 },
      { ID: 5, Time: now - 5000, Level: 'WARN', Data: 'WARN line two', Host: 'local drive', Path: 'C:/temp/log/warn.log', Amount: 50 },
      { ID: 6, Time: now - 6000, Level: 'WARN', Data: 'WARN line three', Host: 'local drive', Path: 'C:/temp/log/warn.log', Amount: 60 },
      { ID: 7, Time: now - 7000, Level: 'ERROR', Data: 'ERROR line one', Host: 'server2', Path: '/var/log/error.log', Amount: 70 },
      { ID: 8, Time: now - 8000, Level: 'ERROR', Data: 'ERROR line two', Host: 'server2', Path: '/var/log/error.log', Amount: 80 },
      { ID: 9, Time: now - 9000, Level: 'ERROR', Data: 'ERROR line three', Host: 'server2', Path: '/var/log/error.log', Amount: 90 },
    ];
  });

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      declarations: [RawDataComponent],
      imports: [
        MatSidenavModule, MatProgressBarModule, MatTableModule, MatSortModule, MatPaginatorModule, MatMenuModule,
        MatButtonModule, MatIconModule, MatTooltipModule, MatSnackBarModule, BrowserAnimationsModule, RouterTestingModule,
        MatBottomSheetModule
      ],
      providers: [
        MatBottomSheet,
        { provide: DBService, useValue: dbService },
        { provide: DialogService, useValue: dialogService },
        { provide: NotificationService, useValue: notificationService },
        { provide: HAMMER_LOADER, useValue: () => new Promise(() => { }) }
      ]
    }).compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(RawDataComponent);
    component = fixture.componentInstance;
    getActiveSceneSpy = spyOn(dbService, 'getActiveScene').and.returnValue(scene);
    const page = { query: new Query(), entries: entries, totalRowCount: entries.length };
    requestEntriesPageSpy = spyOn(dbService, 'requestEntriesPage').and.returnValue(Promise.resolve(page));
    spyOn(dialogService, 'showConfirmDialog').and.returnValue(null);
    exportService = TestBed.inject(ExportService);
    fixture.detectChanges();
    flush();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should request active scene', () => {
    expect(dbService.getActiveScene).toHaveBeenCalled();
  });

  it('should fetch initial entries page', () => {
    const query: Query = requestEntriesPageSpy.calls.mostRecent().args[0];
    expect(query.getPageIndex()).toBe(0);
    expect(query.getRowsPerPage()).toBe(10);
    expect(dbService.requestEntriesPage).toHaveBeenCalled();
    expect(component.entries).toBe(entries);
  });

  it('#ngOnInit should navigate to scenes view when no scene is active', async () => {

    // given
    getActiveSceneSpy.and.returnValue(null);
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    // when
    component.ngOnInit();
    await fixture.whenStable();

    // then
    expect(router.navigateByUrl).toHaveBeenCalledWith(Route.SCENES);
  });

  it('#ngOnInit should not define new query when query is definedactive', fakeAsync(() => {

    // given
    const query = new Query();
    component.query = query;

    // when
    component.ngOnInit();
    flush();

    // then
    expect(component.query).toBe(query);
  }));

  it('#onFilterChanged should notify error when entries page request fails', fakeAsync(() => {

    // given
    requestEntriesPageSpy.and.returnValue(Promise.reject('server error'));
    spyOn(component, 'notifyError').and.callFake(err => null);

    // when
    component.onFilterChanged(new Query());
    flush();

    // then
    expect(component.loading).toBeFalsy();
    expect(component.notifyError).toHaveBeenCalledWith('server error');
  }));

  it('#sortEntries should fetch first page of sorted data', () => {

    // given
    component.paginator.pageSize = 10;

    // when
    component.sortEntries({ active: 'Path', direction: 'desc' });

    // then
    expect(dbService.requestEntriesPage).toHaveBeenCalled();
    const query: Query = requestEntriesPageSpy.calls.mostRecent().args[0];
    expect(query.getSort()).toEqual(<Sort>{ active: 'Path', direction: 'desc' });
    expect(query.getPageIndex()).toBe(0);
    expect(query.getRowsPerPage()).toBe(10);
  });

  it('#sortEntries should show CouchDB limitation dialog when CouchDB is in use', async () => {

    // given
    SortLimitationWorkaround.couchDbSortLimitationDialogData.rememberChoice = false;
    spyOn(dbService, 'isCouchDbInUse').and.returnValue(true);

    // when
    component.sortEntries({ active: 'Level', direction: 'asc' });
    await fixture.whenStable();

    // then
    expect(dialogService.showConfirmDialog).toHaveBeenCalled();
  });

  it('#sortEntries should not show CouchDB limitation dialog when user suppressed it', fakeAsync(() => {

    // given
    SortLimitationWorkaround.couchDbSortLimitationDialogData.rememberChoice = true;
    spyOn(dbService, 'isCouchDbInUse').and.returnValue(true);

    // when
    component.sortEntries({ active: 'Level', direction: 'asc' });
    flush();

    // then
    expect(dialogService.showConfirmDialog).not.toHaveBeenCalled();
  }));

  it('#formattedValueOf should return empty string when object value is null', () => {

    // given
    const column: Column = { name: 'Nested', dataType: DataType.OBJECT, width: 100 };
    const entry = { ID: 1, Nested: null };

    // when
    const formatted = component.formattedValueOf(column, entry);

    // then
    expect(formatted).toBe('');
  });

  it('#formattedValueOf should return ellipsis when object value is defined', () => {

    // given
    const column: Column = { name: 'Nested', dataType: DataType.OBJECT, width: 100 };
    const entry = { ID: 1, Nested: '{ a: \'x\' }' };

    // when
    const formatted = component.formattedValueOf(column, entry);

    // then
    expect(formatted).toBe('...');
  });

  it('#formattedValueOf should return empty string when number value is null', () => {

    // given
    const column: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 100 };
    const entry = { ID: 1, Amount: null };

    // when
    const formatted = component.formattedValueOf(column, entry);

    // then
    expect(formatted).toBe('');
  });

  it('#formattedValueOf should return formatted time using column displayFormat', () => {

    // given
    const column: Column = {
      name: 'Time', dataType: DataType.TIME, width: 100,
      format: 'yyyy-MM-dd HH:mm:ss SSS'
    };
    const time = new Date('2019-01-30T18:24:17').getTime() + 557;
    const entry = { ID: 1, Time: time };

    // when
    const formatted = component.formattedValueOf(column, entry);

    // then
    expect(formatted).toBe('2019-01-30 18:24:17 557');
  });

  it('#formattedValueOf should return formatted number using current locale', () => {

    // given
    const column: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 100 };
    const entry = { ID: 1, Amount: 15_000 };

    // when
    const formatted = component.formattedValueOf(column, entry);

    // then    
    expect(formatted).toBe((15_000).toLocaleString());
  });

  it('#formattedValueOf should return value when value is text', () => {

    // given
    const column: Column = { name: 'Host', dataType: DataType.TEXT, width: 100 };
    const entry = { ID: 1, Host: 'server1' };

    // when
    const formatted = component.formattedValueOf(column, entry);

    // then
    expect(formatted).toBe('server1');
  });

  it('#displayValue should display dialog when data type is OBJECT', () => {

    // given
    const column: Column = { name: 'Data', dataType: DataType.OBJECT, width: 100 };
    const entry = { ID: 1, Data: '[ 1, 2, 3]' };

    // when
    component.displayValue(column, entry);

    // then
    expect(dialogService.showConfirmDialog).toHaveBeenCalled();
  });

  it('#displayValue should not display dialog when data type is not OBJECT', () => {

    // given
    const column: Column = { name: 'Host', dataType: DataType.TEXT, width: 100 };
    const entry = { ID: 1, Host: 'server1' };

    // when
    component.displayValue(column, entry);

    // then
    expect(dialogService.showConfirmDialog).not.toHaveBeenCalled();
  });

  it('#onFilterChanged should fetch first page using new query', () => {

    // given
    component.paginator.pageSize = 50;

    // when
    component.onFilterChanged(new Query());

    // then
    expect(dbService.requestEntriesPage).toHaveBeenCalled();
    const query: Query = requestEntriesPageSpy.calls.mostRecent().args[0];
    expect(query.getPageIndex()).toBe(0);
    expect(query.getRowsPerPage()).toBe(50);
  });

  it('#adjustLayout should adjust content max height when non-dialog style', () => {

    // given
    const divContent = { style: { marginTop: '' } };
    component.divContentRef = new ElementRef(<HTMLDivElement>divContent);

    // when
    component.adjustLayout();

    // then
    expect(divContent.style['maxHeight']).toBeDefined();
  });

  it('#adjustLayout should adjust content max height when dialog style', () => {

    // given
    component.dialogStyle = true;
    const divContent = { style: { marginTop: '' } };
    component.divContentRef = new ElementRef(<HTMLDivElement>divContent);

    // when
    component.adjustLayout();

    // then
    expect(divContent.style['maxHeight']).toBeDefined();
  });

  it('#saveAs should save complete data as CSV file', fakeAsync(() => {

    // given;
    spyOn(dbService, 'findEntries').and.returnValue(of(entries));
    spyOn(component.snackBar, 'open').and.callThrough();
    spyOn(exportService, 'exportData').and.callFake(() => null);

    // when
    component.saveAs(ExportFormat.CSV);
    flush();

    // then
    expect(component.snackBar.open).toHaveBeenCalledWith('complete data is collected and saves as CSV in the background',
      undefined, { duration: 3000 });
    expect(exportService.exportData).toHaveBeenCalledWith(entries, ExportFormat.CSV, 'Raw-Data');
  }));

  it('#saveAs should save filtered data as CSV file', fakeAsync(() => {

    // given;
    spyOn(dbService, 'findEntries').and.returnValue(of(entries));
    spyOn(component.snackBar, 'open').and.callThrough();
    spyOn(exportService, 'exportData').and.callFake(() => null);
    component.query.setFullTextFilter('x');

    // when
    component.saveAs(ExportFormat.CSV);
    flush();

    // then
    expect(component.snackBar.open).toHaveBeenCalledWith('filtered data is collected and saves as CSV in the background',
      undefined, { duration: 3000 });
    expect(exportService.exportData).toHaveBeenCalledWith(entries, ExportFormat.CSV, 'Raw-Data');
  }));

  it('#saveAs should save complete data as Excel file', fakeAsync(() => {

    // given;
    spyOn(dbService, 'findEntries').and.returnValue(of(entries));
    spyOn(component.snackBar, 'open').and.callThrough();
    spyOn(exportService, 'exportData').and.callFake(() => null);

    // when
    component.saveAs(ExportFormat.EXCEL);
    flush();

    // then
    expect(component.snackBar.open).toHaveBeenCalledWith('complete data is collected and saves as Excel in the background',
      undefined, { duration: 3000 });
    expect(exportService.exportData).toHaveBeenCalledWith(entries, ExportFormat.EXCEL, 'Raw-Data');
  }));

  it('#saveAs should save filtered data as Excel file', fakeAsync(() => {

    // given;
    spyOn(dbService, 'findEntries').and.returnValue(of(entries));
    spyOn(component.snackBar, 'open').and.callThrough();
    spyOn(exportService, 'exportData').and.callFake(() => null);
    component.query.setFullTextFilter('x');

    // when
    component.saveAs(ExportFormat.EXCEL);
    flush();

    // then
    expect(component.snackBar.open).toHaveBeenCalledWith('filtered data is collected and saves as Excel in the background',
      undefined, { duration: 3000 });
    expect(exportService.exportData).toHaveBeenCalledWith(entries, ExportFormat.EXCEL, 'Raw-Data');
  }));

  it('#saveAs should save complete data as JSON file', fakeAsync(() => {

    // given;
    spyOn(dbService, 'findEntries').and.returnValue(of(entries));
    spyOn(component.snackBar, 'open').and.callThrough();
    spyOn(exportService, 'exportData').and.callFake(() => null);

    // when
    component.saveAs(ExportFormat.JSON);
    flush();

    // then
    expect(component.snackBar.open).toHaveBeenCalledWith('complete data is collected and saves as JSON in the background',
      undefined, { duration: 3000 });
    expect(exportService.exportData).toHaveBeenCalledWith(entries, ExportFormat.JSON, 'Raw-Data');
  }));

  it('#saveAs should save filtered data as JSON file', fakeAsync(() => {

    // given;
    spyOn(dbService, 'findEntries').and.returnValue(of(entries));
    spyOn(component.snackBar, 'open').and.callThrough();
    spyOn(exportService, 'exportData').and.callFake(() => null);
    component.query.setFullTextFilter('x');

    // when
    component.saveAs(ExportFormat.JSON);
    flush();

    // then
    expect(component.snackBar.open).toHaveBeenCalledWith('filtered data is collected and saves as JSON in the background',
      undefined, { duration: 3000 });
    expect(exportService.exportData).toHaveBeenCalledWith(entries, ExportFormat.JSON, 'Raw-Data');
  }));

  it('#saveAs should notify error', fakeAsync(() => {

    // given;
    spyOn(dbService, 'findEntries').and.returnValue(throwError({ status: 404 }));
    spyOn(notificationService, 'onError');

    // when
    component.saveAs(ExportFormat.JSON);
    flush();

    // then
    expect(notificationService.onError).toHaveBeenCalled();
  }));

  it('#click on print button should print window', async () => {

    // given;
    const okButton: HTMLSelectElement = fixture.debugElement.query(By.css('#but_print')).nativeElement;
    spyOn(window, 'print');

    // when
    okButton.click();
    fixture.whenStable();

    // then
    expect(window.print).toHaveBeenCalled();
  });
});
