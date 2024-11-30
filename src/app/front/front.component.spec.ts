import { ComponentFixture, TestBed, fakeAsync, flush, waitForAsync } from '@angular/core/testing';

import { Component } from '@angular/core';
import { FormsModule, UntypedFormBuilder } from '@angular/forms';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HAMMER_LOADER } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ConnectionInfo, Protocol, Route, SceneInfo } from 'app/shared/model';
import { DialogService, NotificationService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { CouchDBService } from 'app/shared/services/backend/couchdb';
import { ReaderService } from 'app/shared/services/reader';
import { CouchDBServiceMock, QueryParams, SceneFactory } from 'app/shared/test';
import { NotificationServiceMock } from 'app/shared/test/notification-service-mock';
import { QueryParamExtractor } from 'app/shared/utils';
import { Observable, of } from 'rxjs';
import { ConnectionDialogComponent, ConnectionDialogData } from './connection-dialog/connection-dialog.component';
import { FrontComponent } from './front.component';

@Component({
    template: '',
    standalone: false
})
class DummyComponent { }

const couchDBService = new CouchDBServiceMock();
const readerService = new ReaderService();
const dialogService = new DialogService(null);
const connectionInfo: ConnectionInfo = { protocol: Protocol.HTTP, host: 'localhost', port: 5984, user: 'test', password: 'secret' };
const notificationService = new NotificationServiceMock();
let dbService: DBService;
let isIndexedDbInUseSpy: jasmine.Spy;
let initBackendSpy: jasmine.Spy;
let findSceneInfosSpy: jasmine.Spy;

describe('FrontComponent', () => {

  let component: FrontComponent;
  let fixture: ComponentFixture<FrontComponent>;

  beforeEach(waitForAsync(() => {
    spyOn(console, 'log');
    dbService = new DBService(couchDBService);
    TestBed.configureTestingModule({
      declarations: [FrontComponent, DummyComponent],
      imports: [BrowserAnimationsModule, MatCardModule, FormsModule, MatFormFieldModule, MatButtonModule, MatSelectModule, MatIconModule,
        MatDialogModule, MatStepperModule, MatTooltipModule, RouterTestingModule,
        RouterModule.forRoot([{ path: '**', component: DummyComponent }], {})
      ],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParamMap: of(new QueryParams()) } },
        MatBottomSheet,
        { provide: DBService, useValue: dbService },
        { provide: CouchDBService, useValue: couchDBService },
        { provide: ReaderService, useValue: readerService },
        { provide: DialogService, useValue: dialogService },
        { provide: NotificationService, useValue: notificationService },
        UntypedFormBuilder,
        { provide: HAMMER_LOADER, useValue: () => Promise.resolve({}) }
      ]
    })
      .compileComponents();
    initBackendSpy = spyOn(dbService, 'initBackend').and.resolveTo();
    isIndexedDbInUseSpy = spyOn(dbService, 'isIndexedDbInUse').and.returnValue(true);
    const sceneInfos = createSceneInfos(5);
    findSceneInfosSpy = spyOn(dbService, 'findSceneInfos').and.resolveTo(sceneInfos);
  }));

  beforeEach(async () => {
    fixture = TestBed.createComponent(FrontComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should pre-select IndexedDB', () => {
    expect(component.selectedDataStorage).toBe(component.indexedDB);
    expect(component.ready).toBeTrue();
  });

  it('#ngOnInit should notify error when backend cannot be initialized', fakeAsync(() => {

    // given
    initBackendSpy.and.rejectWith();
    spyOn(notificationService, 'onError');

    // when
    component.ngOnInit();
    flush();

    // then
    expect(notificationService.onError).toHaveBeenCalled();
  }));

  it('#onDataStorageChanged should be ignored when storage did not change', fakeAsync(() => {

    // given
    component.selectedDataStorage = component.indexedDB;
    spyOn(dbService, 'useIndexedDb').and.resolveTo();

    // when
    component.onDataStorageChanged(component.indexedDB);
    flush();

    // then
    expect(dbService.useIndexedDb).not.toHaveBeenCalled();
    expect(component.selectedDataStorage).toBe(component.indexedDB);
    expect(component.ready).toBeTrue();
  }));

  it('#onDataStorageChanged should switch to IndexedDB', fakeAsync(() => {

    // given
    component.selectedDataStorage = component.couchDB;
    spyOn(dbService, 'useIndexedDb').and.resolveTo();
    spyOn(notificationService, 'onSuccess');

    // when
    component.onDataStorageChanged(component.indexedDB);
    flush();

    // then
    expect(dbService.useIndexedDb).toHaveBeenCalled();
    expect(component.selectedDataStorage).toBe(component.indexedDB);
    expect(notificationService.onSuccess).toHaveBeenCalled();
  }));

  it('#onDataStorageChanged should not init CouchDB connection when user canceled connection dialog', fakeAsync(() => {

    // given
    component.selectedDataStorage = component.indexedDB;
    const dialogRef = createConnectionDialogRef();
    spyOn(dialogService, 'showConnectionDialog').and.callFake((data: ConnectionDialogData) => {
      data.closedWithOK = false;
      return dialogRef;
    });
    spyOn(couchDBService, 'initConnection');
    spyOn(notificationService, 'onSuccess');

    // when
    component.onDataStorageChanged(component.couchDB);
    flush();

    // then
    expect(dialogService.showConnectionDialog).toHaveBeenCalled();
    expect(couchDBService.initConnection).not.toHaveBeenCalled();
    expect(notificationService.onSuccess).not.toHaveBeenCalled();
    expect(component.selectedDataStorage).toBe(component.indexedDB);
  }));


  it('#onDataStorageChanged should init CouchDB connection when user confirms new connection with OK', fakeAsync(() => {

    // given
    component.selectedDataStorage = component.indexedDB;
    spyOn(couchDBService, 'getConnectionInfo').and.returnValue(connectionInfo);
    const dialogRef = createConnectionDialogRef();
    spyOn(dialogService, 'showConnectionDialog').and.callFake((data: ConnectionDialogData) => {
      data.closedWithOK = true;
      return dialogRef;
    });
    spyOn(couchDBService, 'initConnection').and.resolveTo('connection establihed');
    initBackendSpy.calls.reset();
    spyOn(notificationService, 'onSuccess');

    // when
    component.onDataStorageChanged(component.couchDB);
    flush();

    // then
    expect(dialogService.showConnectionDialog).toHaveBeenCalled();
    expect(couchDBService.initConnection).toHaveBeenCalled();
    expect(dbService.initBackend).toHaveBeenCalled();
    expect(notificationService.onSuccess).toHaveBeenCalled();
  }));

  it('#onDataStorageChanged should init CouchDB connection when user confirmed modified connection with OK', fakeAsync(() => {

    // given
    component.selectedDataStorage = component.indexedDB;
    isIndexedDbInUseSpy.and.returnValue(true);
    spyOn(couchDBService, 'getConnectionInfo').and.returnValue(connectionInfo);
    const dialogRef = createConnectionDialogRef();
    spyOn(dialogService, 'showConnectionDialog').and.callFake((data: ConnectionDialogData) => {
      data.connectionInfo.port = 999;
      data.closedWithOK = true;
      return dialogRef;
    });
    spyOn(couchDBService, 'initConnection').and.resolveTo('connection establihed');
    initBackendSpy.calls.reset();
    spyOn(notificationService, 'onSuccess');

    // when
    component.onDataStorageChanged(component.couchDB);
    flush();

    // then
    expect(dialogService.showConnectionDialog).toHaveBeenCalled();
    expect(couchDBService.initConnection).toHaveBeenCalled();
    expect(dbService.initBackend).toHaveBeenCalled();
    const bottomSheet = TestBed.inject(MatBottomSheet);
    expect(notificationService.onSuccess).toHaveBeenCalledWith(bottomSheet, 'connection establihed');
  }));

  it('#onDataStorageChanged should show error when connection to CouchDB fails', fakeAsync(() => {

    // given
    component.selectedDataStorage = component.indexedDB;
    spyOn(couchDBService, 'getConnectionInfo').and.returnValue(connectionInfo);
    const dialogRef = createConnectionDialogRef();
    spyOn(dialogService, 'showConnectionDialog').and.callFake((data: ConnectionDialogData) => {
      data.connectionInfo.port = 999;
      data.closedWithOK = true;
      return dialogRef;
    });
    spyOn(couchDBService, 'initConnection').and.rejectWith('connection failed');
    initBackendSpy.calls.reset();
    spyOn(notificationService, 'onError');

    // when
    component.onDataStorageChanged(component.couchDB);
    flush();

    // then
    expect(dialogService.showConnectionDialog).toHaveBeenCalled();
    expect(couchDBService.initConnection).toHaveBeenCalled();
    expect(dbService.initBackend).not.toHaveBeenCalled();
    expect(notificationService.onError).toHaveBeenCalled();
  }));

  it('#onDataStorageChanged should show error when backend cannot be initialized', fakeAsync(() => {

    // given
    component.selectedDataStorage = component.indexedDB;
    spyOn(couchDBService, 'getConnectionInfo').and.returnValue(connectionInfo);
    const dialogRef = createConnectionDialogRef();
    spyOn(dialogService, 'showConnectionDialog').and.callFake((data: ConnectionDialogData) => {
      data.connectionInfo.port = 999;
      data.closedWithOK = true;
      return dialogRef;
    });
    spyOn(couchDBService, 'initConnection').and.resolveTo('connection establihed');
    initBackendSpy.and.rejectWith('cannot initialize backend');
    spyOn(notificationService, 'onError');

    // when
    component.onDataStorageChanged(component.couchDB);
    flush();

    // then
    expect(dialogService.showConnectionDialog).toHaveBeenCalled();
    expect(couchDBService.initConnection).toHaveBeenCalled();
    expect(dbService.initBackend).toHaveBeenCalled();
    expect(notificationService.onError).toHaveBeenCalled();
  }));

  it('#onDataStorageChanged should show error when scene infos cannot be read', fakeAsync(() => {

    // given
    component.selectedDataStorage = component.indexedDB;
    isIndexedDbInUseSpy.and.returnValue(false);
    spyOn(couchDBService, 'getConnectionInfo').and.returnValue(connectionInfo);
    const dialogRef = createConnectionDialogRef();
    spyOn(dialogService, 'showConnectionDialog').and.callFake((data: ConnectionDialogData) => {
      data.connectionInfo.port = 999;
      data.closedWithOK = true;
      return dialogRef;
    });
    spyOn(couchDBService, 'initConnection').and.resolveTo('connection establihed');
    initBackendSpy.calls.reset();
    findSceneInfosSpy.and.rejectWith('backend not available');
    spyOn(notificationService, 'onError');

    // when
    component.onDataStorageChanged(component.couchDB);
    flush();

    // then
    const bottomSheet = TestBed.inject(MatBottomSheet);
    expect(notificationService.onError).toHaveBeenCalledWith(bottomSheet, 'backend not available');
  }));

  it('#showCouchDBConnectionDialog should not init connection when connection was not changed', fakeAsync(() => {

    // given
    component.selectedDataStorage = component.couchDB;
    isIndexedDbInUseSpy.and.returnValue(false);
    const dialogRef = createConnectionDialogRef();
    spyOn(dialogService, 'showConnectionDialog').and.callFake((data: ConnectionDialogData) => {
      data.closedWithOK = true;
      return dialogRef;
    });
    spyOn(couchDBService, 'initConnection');

    // when
    component.showCouchDBConnectionDialog();
    flush();

    // then
    expect(couchDBService.initConnection).not.toHaveBeenCalled();
  }));

  it('#showCouchDBConnectionDialog should not switch to IndexedDB when couchDB was selected and dialog is canceled', fakeAsync(() => {

    // given
    component.selectedDataStorage = component.couchDB;
    isIndexedDbInUseSpy.and.returnValue(false);
    const dialogRef = createConnectionDialogRef();
    spyOn(dialogService, 'showConnectionDialog').and.callFake((data: ConnectionDialogData) => {
      data.closedWithOK = false;
      return dialogRef;
    });
    spyOn(couchDBService, 'initConnection');

    // when
    component.showCouchDBConnectionDialog();
    flush();

    // then
    expect(component.selectedDataStorage).toBe(component.couchDB);
  }));

  it('#colorOf couchDB', () => {
    component.ready = true;
    component.selectedDataStorage = component.couchDB;
    expect(component.colorOf(component.couchDB)).toBe('active');

    component.ready = false;
    expect(component.colorOf(component.couchDB)).toBe('corrupt');

    component.selectedDataStorage = component.indexedDB;
    expect(component.colorOf(component.couchDB)).toBe('inactive');
  });

  it('#colorOf indexedDB', () => {
    component.selectedDataStorage = component.indexedDB;
    expect(component.colorOf(component.indexedDB)).toBe('active');

    component.selectedDataStorage = component.couchDB;
    expect(component.colorOf(component.indexedDB)).toBe('inactive');
  });

  function createSceneInfos(count: number): SceneInfo[] {
    const sceneInfos: SceneInfo[] = [];
    const now = new Date().getTime();
    for (let i = 0; i < count; i++) {
      sceneInfos.push({
        creationTime: now,
        name: 'abc ' + i,
        shortDescription: 'xyz ' + i,
        database: 'data_' + i,
        columnMappings: undefined
      });
    }
    return sceneInfos;
  }

  function createConnectionDialogRef(): MatDialogRef<ConnectionDialogComponent> {
    return <MatDialogRef<ConnectionDialogComponent>>{
      afterClosed(): Observable<boolean> {
        return of(true);
      }
    };
  }
});

describe('FrontComponent (external invocation)', () => {

  const sceneID = '123';
  let component: FrontComponent;
  let router: Router;

  beforeEach(waitForAsync(() => {
    spyOn(console, 'log');
    dbService = new DBService(couchDBService);
    TestBed.configureTestingModule({
      declarations: [FrontComponent, DummyComponent],
      imports: [BrowserAnimationsModule, MatCardModule, FormsModule, MatFormFieldModule, MatButtonModule, MatSelectModule, MatIconModule,
        MatDialogModule, MatStepperModule, MatTooltipModule, RouterTestingModule,
        RouterModule.forRoot([{ path: '**', component: DummyComponent }], {})
      ],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParamMap: of(createQueryParams()) } },
        MatBottomSheet,
        { provide: DBService, useValue: dbService },
        { provide: CouchDBService, useValue: couchDBService },
        { provide: ReaderService, useValue: readerService },
        { provide: DialogService, useValue: dialogService },
        { provide: NotificationService, useValue: notificationService },
        UntypedFormBuilder,
        { provide: HAMMER_LOADER, useValue: () => new Promise(() => { }) }
      ]
    })
      .compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    const fixture = TestBed.createComponent(FrontComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(couchDBService, 'initConnection').and.resolveTo('connection established');
    initBackendSpy = spyOn(dbService, 'initBackend').and.resolveTo();
    spyOn(dbService, 'activateScene').and.resolveTo(SceneFactory.createScene('1', []));
    spyOn(router, 'navigateByUrl');
    fixture.detectChanges();
    flush();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should activate scene and navigate to raw data view', () => {
    expect(couchDBService.initConnection).toHaveBeenCalledWith(
      <ConnectionInfo>{ protocol: 'HTTP', host: 'localhost', port: 5984, user: 'test', password: 'secret' });
    expect(dbService.initBackend).toHaveBeenCalled();
    expect(dbService.activateScene).toHaveBeenCalledWith(sceneID);
    expect(router.navigateByUrl).toHaveBeenCalledWith(Route.RAWDATA);
  });

  it('#ngOnInit should notify error when backend cannot be initialized', fakeAsync(() => {

    // given
    initBackendSpy.and.rejectWith();
    spyOn(notificationService, 'onError');

    // when
    component.ngOnInit();
    flush();

    // then
    expect(notificationService.onError).toHaveBeenCalled();
  }));

  function createQueryParams(): QueryParams {
    const queryParams = new QueryParams();
    queryParams.set(QueryParamExtractor.PROTOCOL, 'HTTP');
    queryParams.set(QueryParamExtractor.HOST, 'localhost');
    queryParams.set(QueryParamExtractor.PORT, '5984');
    queryParams.set(QueryParamExtractor.USER, 'test');
    queryParams.set(QueryParamExtractor.PASSWORD, btoa('secret'));
    queryParams.set(QueryParamExtractor.SCENE_ID, sceneID);
    return queryParams;
  }
});
