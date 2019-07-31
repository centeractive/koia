import { async, ComponentFixture, TestBed, flush, fakeAsync } from '@angular/core/testing';

import { FrontComponent } from './front.component';
import {
  MatCardModule, MatButtonModule, MatSelectModule, MatFormFieldModule, MatBottomSheet, MatIconModule,
  MatDialogModule,
  MatStepperModule,
  MatTooltipModule,
  MatDialogRef
} from '@angular/material';
import { NotificationService, DialogService } from 'app/shared/services';
import { Status, SceneInfo } from 'app/shared/model';
import { ReaderService } from 'app/shared/services/reader';
import { DBService } from 'app/shared/services/backend';
import { CouchDBService, ConnectionInfo } from 'app/shared/services/backend/couchdb';
import { HAMMER_LOADER } from '@angular/platform-browser';
import { FormsModule, FormBuilder } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { RouterModule } from '@angular/router';
import { Component } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ConnectionDialogComponent } from './connection-dialog/connection-dialog.component';
import { Observable, of } from 'rxjs';

@Component({ template: '' })
class DummyComponent { }

class FakeCouchDBService extends CouchDBService {

  constructor() {
    super(null);
  }

  listDatabases(): Promise<string[]> {
    return Promise.resolve(['data_1'])
  }
}

class FakeNotificationService extends NotificationService {

  constructor() {
    super();
  }

  showStatus(bottomSheet: MatBottomSheet, status: Status): void {
  }
}

const couchDBService = new FakeCouchDBService();
const readerService = new ReaderService();
const dialogService = new DialogService(null);
const notificationService = new FakeNotificationService();
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
        MatDialogModule, MatStepperModule, MatTooltipModule,
        RouterTestingModule, RouterModule.forRoot([{ path: '**', component: DummyComponent }])
      ],
      providers: [MatBottomSheet,
        { provide: ReaderService, useValue: readerService },
        { provide: DBService, useValue: dbService },
        { provide: CouchDBService, useValue: couchDBService },
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
    initBackendSpy = spyOn(dbService, 'initBackend');
    initBackendSpy.and.returnValue(Promise.resolve());
    usesBrowserStroageSpy = spyOn(dbService, 'usesBrowserStorage');
    usesBrowserStroageSpy.and.returnValue(true);
    const sceneInfos = createSceneInfos(5);
    spyOn(dbService, 'findSceneInfos').and.returnValue(Promise.resolve(sceneInfos));
    fixture.detectChanges();
    flush();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should pre-select browser storage', () => {
    expect(component.selectedDataStorage).toBe(component.browser);
  });

  it('#onDataStorageChanged should not init CouchDB connection when user leaves active connection unchanged', fakeAsync(() => {

    // given
    const dialogRef = createConnectionDialogRef();
    usesBrowserStroageSpy.and.returnValue(false);
    spyOn(dialogService, 'showConnectionDialog').and.returnValue(dialogRef);
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
  }));

  it('#onDataStorageChanged should switch to browser data store', fakeAsync(() => {

    // given
    spyOn(dbService, 'useBrowserStorage').and.returnValue(Promise.resolve());
    spyOn(notificationService, 'onSuccess');
    component.selectedDataStorage = component.browser;

    // when
    component.onDataStorageChanged();
    flush();

    // then
    expect(notificationService.onSuccess).toHaveBeenCalled();
  }));

  it('#onDataStorageChanged should init CouchDB connection when user modifies connection info', fakeAsync(() => {

    // given
    let connectionInfo: ConnectionInfo;
    spyOn(couchDBService, 'getConnectionInfo').and.callFake(() => {
      connectionInfo = { host: 'localhost', port: 5984, user: 'admin', password: 'admin' };
      return connectionInfo;
    });
    const dialogRef = createConnectionDialogRef();
    spyOn(dialogService, 'showConnectionDialog').and.callFake(() => {
      connectionInfo.port = 999;
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
    let connectionInfo: ConnectionInfo;
    spyOn(couchDBService, 'getConnectionInfo').and.callFake(() => {
      connectionInfo = { host: 'localhost', port: 5984, user: 'admin', password: 'admin' };
      return connectionInfo;
    });
    const dialogRef = createConnectionDialogRef();
    spyOn(dialogService, 'showConnectionDialog').and.callFake(() => {
      connectionInfo.port = 999;
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
    let connectionInfo: ConnectionInfo;
    spyOn(couchDBService, 'getConnectionInfo').and.callFake(() => {
      connectionInfo = { host: 'localhost', port: 5984, user: 'admin', password: 'admin' };
      return connectionInfo;
    });
    const dialogRef = createConnectionDialogRef();
    spyOn(dialogService, 'showConnectionDialog').and.callFake(() => {
      connectionInfo.port = 999;
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
