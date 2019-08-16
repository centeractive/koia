import { async, ComponentFixture, TestBed, flush, fakeAsync } from '@angular/core/testing';

import { FrontComponent } from './front.component';
import {
  MatCardModule, MatButtonModule, MatSelectModule, MatFormFieldModule, MatBottomSheet, MatIconModule,
  MatDialogModule, MatStepperModule, MatTooltipModule, MatDialogRef
} from '@angular/material';
import { NotificationService, DialogService } from 'app/shared/services';
import { SceneInfo, Route, Protocol, ConnectionInfo } from 'app/shared/model';
import { ReaderService } from 'app/shared/services/reader';
import { DBService } from 'app/shared/services/backend';
import { CouchDBService } from 'app/shared/services/backend/couchdb';
import { HAMMER_LOADER } from '@angular/platform-browser';
import { FormsModule, FormBuilder } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Component } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ConnectionDialogComponent, ConnectionDialogData } from './connection-dialog/connection-dialog.component';
import { Observable, of } from 'rxjs';
import { NotificationServiceMock } from 'app/shared/test/notification-service-mock';
import { CouchDBServiceMock, QueryParams } from 'app/shared/test';
import { QueryParamExtractor } from 'app/shared/utils';

@Component({ template: '' })

class DummyComponent { }

const couchDBService = new CouchDBServiceMock();
const readerService = new ReaderService();
const dialogService = new DialogService(null);
const connectionInfo: ConnectionInfo = { protocol: Protocol.HTTP, host: 'localhost', port: 5984, user: 'test', password: 'secret' };
const notificationService = new NotificationServiceMock();
let dbService: DBService;
let usesBrowserStroageSpy: jasmine.Spy;
let initBackendSpy: jasmine.Spy;

describe('FrontComponent', () => {

  let component: FrontComponent;
  let fixture: ComponentFixture<FrontComponent>;

  beforeEach(async(() => {
    spyOn(console, 'log').and.callFake(s => null);
    dbService = new DBService(couchDBService);
    TestBed.configureTestingModule({
      declarations: [FrontComponent, DummyComponent],
      imports: [BrowserAnimationsModule, MatCardModule, FormsModule, MatFormFieldModule, MatButtonModule, MatSelectModule, MatIconModule,
        MatDialogModule, MatStepperModule, MatTooltipModule, RouterTestingModule,
        RouterModule.forRoot([{ path: '**', component: DummyComponent }])
      ],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParamMap: of(new QueryParams()) } },
        MatBottomSheet,
        { provide: DBService, useValue: dbService },
        { provide: CouchDBService, useValue: couchDBService },
        { provide: ReaderService, useValue: readerService },
        { provide: DialogService, useValue: dialogService },
        { provide: NotificationService, useValue: notificationService },
        FormBuilder,
        { provide: HAMMER_LOADER, useValue: () => new Promise(() => { }) }
      ]
    })
      .compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(FrontComponent);
    component = fixture.componentInstance;
    component.showScreenshots = false;
    initBackendSpy = spyOn(dbService, 'initBackend').and.returnValue(Promise.resolve());
    usesBrowserStroageSpy = spyOn(dbService, 'usesBrowserStorage').and.returnValue(true);
    const sceneInfos = createSceneInfos(5);
    spyOn(dbService, 'findSceneInfos').and.returnValue(Promise.resolve(sceneInfos));
    fixture.detectChanges();
    flush();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should pre-select IndexedDB', () => {
    expect(component.selectedDataStorage).toBe(component.indexedDB);
  });

  it('#onDataStorageChanged should switch to IndexedDB', fakeAsync(() => {

    // given
    spyOn(dbService, 'useBrowserStorage').and.returnValue(Promise.resolve());
    spyOn(notificationService, 'onSuccess');
    component.selectedDataStorage = component.indexedDB;

    // when
    component.onDataStorageChanged();
    flush();

    // then
    expect(notificationService.onSuccess).toHaveBeenCalled();
  }));

  it('#onDataStorageChanged should not init CouchDB connection when user canceled connection dialog', fakeAsync(() => {

    // given
    const dialogRef = createConnectionDialogRef();
    spyOn(dialogService, 'showConnectionDialog').and.callFake((data: ConnectionDialogData) => {
      data.closedWithOK = false;
      return dialogRef;
    });
    spyOn(couchDBService, 'initConnection');
    spyOn(notificationService, 'onSuccess');
    component.selectedDataStorage = component.couchDB;

    // when
    component.onDataStorageChanged();
    flush();

    // then
    expect(dialogService.showConnectionDialog).toHaveBeenCalled();
    expect(couchDBService.initConnection).not.toHaveBeenCalled();
    expect(notificationService.onSuccess).not.toHaveBeenCalled();
    expect(component.selectedDataStorage).toBe(component.indexedDB);
  }));


  it('#onDataStorageChanged should init CouchDB connection when user confirmed new connection with OK', fakeAsync(() => {

    // given
    spyOn(couchDBService, 'getConnectionInfo').and.returnValue(connectionInfo);
    const dialogRef = createConnectionDialogRef();
    spyOn(dialogService, 'showConnectionDialog').and.callFake((data: ConnectionDialogData) => {
      data.closedWithOK = true;
      return dialogRef;
    });
    spyOn(couchDBService, 'initConnection').and.returnValue(Promise.resolve('connection establihed'));
    initBackendSpy.calls.reset();
    spyOn(notificationService, 'onSuccess');
    component.selectedDataStorage = component.couchDB;

    // when
    component.onDataStorageChanged();
    flush();

    // then
    expect(dialogService.showConnectionDialog).toHaveBeenCalled();
    expect(couchDBService.initConnection).toHaveBeenCalled();
    expect(dbService.initBackend).toHaveBeenCalled();
    expect(notificationService.onSuccess).toHaveBeenCalled();
  }));

  it('#onDataStorageChanged should init CouchDB connection when user confirmed modified connection with OK', fakeAsync(() => {

    // given
    usesBrowserStroageSpy.and.returnValue(false);
    spyOn(couchDBService, 'getConnectionInfo').and.returnValue(connectionInfo);
    const dialogRef = createConnectionDialogRef();
    spyOn(dialogService, 'showConnectionDialog').and.callFake((data: ConnectionDialogData) => {
      data.connectionInfo.port = 999;
      data.closedWithOK = true;
      return dialogRef;
    });
    spyOn(couchDBService, 'initConnection').and.returnValue(Promise.resolve('connection establihed'));
    initBackendSpy.calls.reset();
    spyOn(notificationService, 'onSuccess');
    component.selectedDataStorage = component.couchDB;

    // when
    component.onDataStorageChanged();
    flush();

    // then
    expect(dialogService.showConnectionDialog).toHaveBeenCalled();
    expect(couchDBService.initConnection).toHaveBeenCalled();
    expect(dbService.initBackend).toHaveBeenCalled();
    expect(notificationService.onSuccess).toHaveBeenCalled();
  }));

  it('#onDataStorageChanged should show error when connection to CouchDB fails', fakeAsync(() => {

    // given
    spyOn(couchDBService, 'getConnectionInfo').and.returnValue(connectionInfo);
    const dialogRef = createConnectionDialogRef();
    spyOn(dialogService, 'showConnectionDialog').and.callFake((data: ConnectionDialogData) => {
      data.connectionInfo.port = 999;
      data.closedWithOK = true;
      return dialogRef;
    });
    spyOn(couchDBService, 'initConnection').and.returnValue(Promise.reject('connection failed'));
    initBackendSpy.calls.reset();
    spyOn(notificationService, 'onError');
    component.selectedDataStorage = component.couchDB;

    // when
    component.onDataStorageChanged();
    flush();

    // then
    expect(dialogService.showConnectionDialog).toHaveBeenCalled();
    expect(couchDBService.initConnection).toHaveBeenCalled();
    expect(dbService.initBackend).not.toHaveBeenCalled();
    expect(notificationService.onError).toHaveBeenCalled();
  }));

  it('#onDataStorageChanged should show error when backend cannot be initialized', fakeAsync(() => {

    // given
    spyOn(couchDBService, 'getConnectionInfo').and.returnValue(connectionInfo);
    const dialogRef = createConnectionDialogRef();
    spyOn(dialogService, 'showConnectionDialog').and.callFake((data: ConnectionDialogData) => {
      data.connectionInfo.port = 999;
      data.closedWithOK = true;
      return dialogRef;
    });
    spyOn(couchDBService, 'initConnection').and.returnValue(Promise.resolve('connection establihed'));
    initBackendSpy.and.returnValue(Promise.reject('cannot initialize backend'));
    spyOn(notificationService, 'onError');
    component.selectedDataStorage = component.couchDB;

    // when
    component.onDataStorageChanged();
    flush();

    // then
    expect(dialogService.showConnectionDialog).toHaveBeenCalled();
    expect(couchDBService.initConnection).toHaveBeenCalled();
    expect(dbService.initBackend).toHaveBeenCalled();
    expect(notificationService.onError).toHaveBeenCalled();
  }));

  function createSceneInfos(count: number): SceneInfo[] {
    const sceneInfos: SceneInfo[] = [];
    const now = new Date().getTime();
    for (let i = 0; i < count; i++) {
      sceneInfos.push({ creationTime: now, name: 'abc ' + i, shortDescription: 'xyz ' + i, database: 'data_' + i });
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

  beforeEach(async(() => {
    spyOn(console, 'log').and.callFake(s => null);
    dbService = new DBService(couchDBService);
    TestBed.configureTestingModule({
      declarations: [FrontComponent, DummyComponent],
      imports: [BrowserAnimationsModule, MatCardModule, FormsModule, MatFormFieldModule, MatButtonModule, MatSelectModule, MatIconModule,
        MatDialogModule, MatStepperModule, MatTooltipModule, RouterTestingModule,
        RouterModule.forRoot([{ path: '**', component: DummyComponent }])
      ],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParamMap: of(createQueryParams()) } },
        MatBottomSheet,
        { provide: DBService, useValue: dbService },
        { provide: CouchDBService, useValue: couchDBService },
        { provide: ReaderService, useValue: readerService },
        { provide: DialogService, useValue: dialogService },
        { provide: NotificationService, useValue: notificationService },
        FormBuilder,
        { provide: HAMMER_LOADER, useValue: () => new Promise(() => { }) }
      ]
    })
      .compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    const fixture = TestBed.createComponent(FrontComponent);
    component = fixture.componentInstance;
    component.showScreenshots = false;
    router = TestBed.get(Router);
    spyOn(couchDBService, 'initConnection').and.returnValue(Promise.resolve('connection established'));
    spyOn(dbService, 'initBackend').and.returnValue(Promise.resolve());
    spyOn(dbService, 'activateScene').and.returnValue(Promise.resolve({}));
    spyOn(router, 'navigateByUrl');
    fixture.detectChanges();
    flush();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should activate scene and navigate to raw data view', () => {
    expect(couchDBService.initConnection).toHaveBeenCalledWith(
      { protocol: 'HTTP', host: 'localhost', port: 5984, user: 'test', password: 'secret' });
    expect(dbService.initBackend).toHaveBeenCalled();
    expect(dbService.activateScene).toHaveBeenCalledWith(sceneID);
    expect(router.navigateByUrl).toHaveBeenCalledWith(Route.RAWDATA);
  });

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
