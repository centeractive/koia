import { async, ComponentFixture, TestBed, flush, fakeAsync } from '@angular/core/testing';

import { CUSTOM_ELEMENTS_SCHEMA, ElementRef } from '@angular/core';
import {
  MatTableModule, MatSortModule, MatProgressBarModule, MatSidenavModule, MatPaginatorModule,
  MatIconModule, MatButtonModule, MatTooltipModule, Sort, MatBottomSheet
} from '@angular/material';
import { RawDataComponent } from './raw-data.component';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Column, Query, DataType, Scene, Route } from 'app/shared/model';
import { HAMMER_LOADER, By } from '@angular/platform-browser';
import { DBService } from 'app/shared/services/backend';
import { JSQueryFactory } from 'app/shared/services/backend/jsonserver';
import { RouterTestingModule } from '@angular/router/testing';
import { NotificationService } from 'app/shared/services';
import { CouchDBService } from 'app/shared/services/backend/couchdb';
import { QueryParams, CouchDBServiceMock } from 'app/shared/test';
import { NotificationServiceMock } from 'app/shared/test/notification-service-mock';

describe('RawDataComponent', () => {

  let now: number;
  let scene: Scene;
  let entries: Object[];
  let component: RawDataComponent;
  let fixture: ComponentFixture<RawDataComponent>;
  const dbService: DBService = new DBService(null);
  let getActiveSceneSpy: jasmine.Spy;
  let couchDBService: CouchDBService;
  const notificationService = new NotificationServiceMock();
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
    scene = createScene('1', columns);
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

  beforeEach(async(() => {
    couchDBService = new CouchDBServiceMock();
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      declarations: [RawDataComponent],
      imports: [
        MatSidenavModule, MatProgressBarModule, MatTableModule, MatSortModule, MatPaginatorModule,
        MatButtonModule, MatIconModule, MatTooltipModule, BrowserAnimationsModule, RouterTestingModule
      ],
      providers: [
        { provide: MatBottomSheet, useClass: MatBottomSheet },
        { provide: ActivatedRoute, useValue: { queryParamMap: of(new QueryParams()) } },
        { provide: DBService, useValue: dbService },
        { provide: CouchDBService, useValue: couchDBService },
        { provide: NotificationService, useValue: notificationService },
        { provide: HAMMER_LOADER, useValue: () => new Promise(() => { }) }
      ]
    }).compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(RawDataComponent);
    component = fixture.componentInstance;
    getActiveSceneSpy = spyOn(dbService, 'getActiveScene');
    getActiveSceneSpy.and.returnValue(scene);
    const page = { query: new Query(), entries: entries, totalRowCount: entries.length };
    requestEntriesPageSpy = spyOn(dbService, 'requestEntriesPage').and.returnValue(of(page).toPromise());
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
    expect(query.getRowsPerPage()).toBe(5);
    expect(new JSQueryFactory().create(component.query)).toBe('?_page=1&_limit=5');
    expect(dbService.requestEntriesPage).toHaveBeenCalled();
    expect(component.entries).toBe(entries);
  });

  it('#ngOnInit should navigate to scenes view when no scene is active', fakeAsync(() => {

    // given
    getActiveSceneSpy.and.returnValue(null);
    const router = TestBed.get(Router);
    spyOn(router, 'navigateByUrl');

    // when
    component.ngOnInit();
    flush();

    // then
    expect(router.navigateByUrl).toHaveBeenCalledWith(Route.SCENES);
  }));

  it('#formattedValueOf should return empty string when value is null', () => {

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

  it('#formattedValueOf should return formatted number using locale en-US', () => {

    // given
    const column: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 100 };
    const entry = { ID: 1, Amount: 15_000 };

    // when
    const formatted = component.formattedValueOf(column, entry);

    // then
    expect(formatted).toBe('15,000');
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

  it('#adjustLayout should adjust content margin top', () => {

    // given
    const divHeader = { offsetHeight: 55 };
    component.divHeaderRef = new ElementRef(<HTMLDivElement>divHeader);
    const divContent = { style: { marginTop: '' } };
    component.divContentRef = new ElementRef(<HTMLDivElement>divContent);

    // when
    component.adjustLayout();

    // then
    expect(divContent.style.marginTop).toEqual((55 + RawDataComponent.MARGIN_TOP) + 'px');
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

  function createScene(id: string, columns: Column[]): Scene {
    return {
      _id: id,
      creationTime: new Date().getTime(),
      name: 'Scene ' + id,
      shortDescription: 'Scene ' + id + ' Short Description',
      columns: columns,
      database: 'test_data_' + id,
      config: {
        records: [],
        views: []
      }
    };
  }
});
