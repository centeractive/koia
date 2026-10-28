import { DragDropModule } from '@angular/cdk/drag-drop';
import { Location } from '@angular/common';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component, EnvironmentProviders, Provider } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, waitForAsync } from '@angular/core/testing';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, provideRouter, Router, RouteReuseStrategy, RouterModule } from '@angular/router';
import { ConnectionInfo, Protocol, Route, SceneInfo } from 'app/shared/model';
import { DialogService, NotificationService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { CouchDBService } from 'app/shared/services/backend/couchdb';
import { CouchDBServiceMock, findUnsafeExternalLinks, QueryParams, leftInsetOf, rightInsetOf, rowCountOf, SceneFactory, selectFile, stylesOf, textsOf } from 'app/shared/test';
import { NotificationServiceMock } from 'app/shared/test/notification-service-mock';
import { QueryParamExtractor } from 'app/shared/utils';
import { Observable, of, Subject } from 'rxjs';
import type { Mock } from 'vitest';
import { page } from 'vitest/browser';
import { ConnectionDialogComponent, ConnectionDialogData } from './connection-dialog/connection-dialog.component';
import { FrontGuideComponent } from './front-guide/front-guide.component';
import { FrontComponent } from './front.component';
import { LaunchParamsService } from './launch-params.service';
import { AppRouteReuseStrategy } from 'app/app-route-reuse-strategy';
import { fruitSalesSampleOf } from 'app/shared/samples/fruit-sales.sample';
import { appLogsSampleOf } from 'app/shared/samples/app-logs.sample';
import { SampleSceneService } from 'app/shared/samples/sample-scene.service';
import { SceneFileService } from 'app/shared/scene-file/scene-file.service';
import { LanguageService } from 'app/shared/services/language';
import { LanguageSelectComponent } from 'app/shared/ui/language-select/language-select.component';

@Component({
  template: '',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class DummyComponent { }

const couchDBService = new CouchDBServiceMock();
const dialogService = new DialogService(null);
const connectionInfo: ConnectionInfo = { protocol: Protocol.HTTP, host: 'localhost', port: 5984, user: 'test', password: 'secret' };
const notificationService = new NotificationServiceMock();
const COUCHDB_TIP_DISMISSED = 'koia.front.couchdbTipDismissed';
const sceneID = '123';
let dbService: DBService;
let isIndexedDbInUseSpy: Mock;
let initBackendSpy: Mock;
let findSceneInfosSpy: Mock;

/**
 * @param changes the values that replace the default values, an undefined value omits the param
 */
function createQueryParams(changes: Record<string, string | undefined> = {}): QueryParams {
  const values: Record<string, string | undefined> = {
    [QueryParamExtractor.PROTOCOL]: 'HTTP',
    [QueryParamExtractor.HOST]: 'localhost',
    [QueryParamExtractor.PORT]: '5984',
    [QueryParamExtractor.USER]: 'test',
    [QueryParamExtractor.PASSWORD]: btoa('secret'),
    [QueryParamExtractor.SCENE_ID]: sceneID,
    ...changes
  };
  const queryParams = new QueryParams();
  Object.entries(values)
    .filter(([, value]) => value !== undefined)
    .forEach(([name, value]) => queryParams.set(name, value));
  return queryParams;
}

function configureTestingModule(queryParams: QueryParams, fragment: string | null, ...providers: (Provider | EnvironmentProviders)[]): void {
  TestBed.configureTestingModule({
    declarations: [FrontComponent, FrontGuideComponent, LanguageSelectComponent, DummyComponent],
    imports: [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, MatDialogModule, DragDropModule,
      RouterModule.forRoot([{ path: '**', component: DummyComponent }], {})
    ],
    providers: [
      ...providers,
      { provide: ActivatedRoute, useValue: { queryParamMap: of(queryParams), fragment: of(fragment) } },
      { provide: RouteReuseStrategy, useClass: AppRouteReuseStrategy },
      MatBottomSheet,
      { provide: DBService, useValue: dbService },
      { provide: CouchDBService, useValue: couchDBService },
      { provide: DialogService, useValue: dialogService },
      { provide: NotificationService, useValue: notificationService }
    ]
  });
}

describe('FrontComponent', () => {

  let component: FrontComponent;
  let fixture: ComponentFixture<FrontComponent>;

  beforeEach(waitForAsync(() => {
    vi.spyOn(console, 'log').mockReturnValue(undefined);
    localStorage.removeItem(COUCHDB_TIP_DISMISSED);
    dbService = new DBService(couchDBService, null);
    configureTestingModule(new QueryParams(), null, provideRouter([]));
    TestBed.compileComponents();
    initBackendSpy = vi.spyOn(dbService, 'initBackend').mockResolvedValue(undefined);
    isIndexedDbInUseSpy = vi.spyOn(dbService, 'isIndexedDbInUse').mockReturnValue(true);
    const sceneInfos = createSceneInfos(5);
    findSceneInfosSpy = vi.spyOn(dbService, 'findSceneInfos').mockResolvedValue(sceneInfos);
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
    expect(component.ready).toBe(true);
  });

  it('#ngOnInit should notify error when backend cannot be initialized', fakeAsync(() => {

    // given
    initBackendSpy.mockRejectedValue(undefined);
    vi.spyOn(notificationService, 'onError').mockReturnValue(undefined);

    // when
    component.ngOnInit();
    flush();

    // then
    expect(notificationService.onError).toHaveBeenCalled();
  }));

  it('#ngOnInit should warn on start when browser storage is used instead of saved CouchDB connection', fakeAsync(() => {

    // given
    initBackendSpy.mockResolvedValue({ couchDBError: 'unreachable' });
    vi.spyOn(couchDBService, 'isConnectionSaved').mockReturnValue(true);
    vi.spyOn(notificationService, 'onWarning').mockReturnValue(undefined);

    // when
    component.ngOnInit();
    flush();

    // then
    expect(notificationService.onWarning).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet), 'CouchDB cannot be used, data is stored in this browser (IndexedDB) instead: unreachable');
    expect(component.ready).toBe(true);
  }));

  it('#ngOnInit should not warn on start when browser storage is used instead of default CouchDB connection', fakeAsync(() => {

    // given
    initBackendSpy.mockResolvedValue({ couchDBError: 'unreachable' });
    vi.spyOn(couchDBService, 'isConnectionSaved').mockReturnValue(false);
    vi.spyOn(notificationService, 'onWarning').mockReturnValue(undefined);

    // when
    component.ngOnInit();
    flush();

    // then
    expect(notificationService.onWarning).not.toHaveBeenCalled();
    expect(component.ready).toBe(true);
  }));

  it('#onDataStorageChanged should clear cached views when switching to IndexedDB', fakeAsync(() => {

    // given
    component.selectedDataStorage = component.couchDB;
    const clearSpy = vi.spyOn(TestBed.inject(Router).routeReuseStrategy as AppRouteReuseStrategy, 'clear').mockReturnValue(undefined);
    vi.spyOn(dbService, 'useIndexedDb').mockResolvedValue(undefined);
    vi.spyOn(notificationService, 'onSuccess').mockReturnValue(undefined);

    // when
    component.onDataStorageChanged(component.indexedDB);
    flush();

    // then
    expect(clearSpy).toHaveBeenCalled();
    expect(clearSpy.mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(dbService.useIndexedDb).mock.invocationCallOrder[0]);
  }));

  it('#onDataStorageChanged should clear cached views when connecting to CouchDB', fakeAsync(() => {

    // given
    component.selectedDataStorage = component.indexedDB;
    const clearSpy = vi.spyOn(TestBed.inject(Router).routeReuseStrategy as AppRouteReuseStrategy, 'clear').mockReturnValue(undefined);
    vi.spyOn(dialogService, 'showConnectionDialog').mockImplementation((data: ConnectionDialogData) => {
      data.closedWithOK = true;
      return createConnectionDialogRef();
    });
    vi.spyOn(couchDBService, 'initConnection').mockResolvedValue('connection established');
    initBackendSpy.mockClear();
    vi.spyOn(notificationService, 'onSuccess').mockReturnValue(undefined);

    // when
    component.onDataStorageChanged(component.couchDB);
    flush();

    // then
    expect(clearSpy).toHaveBeenCalled();
    expect(clearSpy.mock.invocationCallOrder[0]).toBeLessThan(initBackendSpy.mock.invocationCallOrder[0]);
  }));

  it('#onDataStorageChanged should warn and show browser storage when CouchDB cannot be used after connecting', fakeAsync(() => {

    // given
    component.selectedDataStorage = component.indexedDB;
    vi.spyOn(dialogService, 'showConnectionDialog').mockImplementation((data: ConnectionDialogData) => {
      data.closedWithOK = true;
      return createConnectionDialogRef();
    });
    vi.spyOn(couchDBService, 'initConnection').mockResolvedValue('connection established');
    initBackendSpy.mockResolvedValue({ couchDBError: 'unreachable' });
    vi.spyOn(notificationService, 'onSuccess').mockReturnValue(undefined);
    vi.spyOn(notificationService, 'onWarning').mockReturnValue(undefined);

    // when
    component.onDataStorageChanged(component.couchDB);
    flush();

    // then
    expect(notificationService.onWarning).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet), 'CouchDB cannot be used, data is stored in this browser (IndexedDB) instead: unreachable');
    expect(notificationService.onSuccess).not.toHaveBeenCalled();
    expect(component.selectedDataStorage).toBe(component.indexedDB);
    expect(component.ready).toBe(true);
  }));

  it('#onDataStorageChanged should be ignored when storage did not change', fakeAsync(() => {

    // given
    component.selectedDataStorage = component.indexedDB;
    vi.spyOn(dbService, 'useIndexedDb').mockResolvedValue(undefined);

    // when
    component.onDataStorageChanged(component.indexedDB);
    flush();

    // then
    expect(dbService.useIndexedDb).not.toHaveBeenCalled();
    expect(component.selectedDataStorage).toBe(component.indexedDB);
    expect(component.ready).toBe(true);
  }));

  it('#onDataStorageChanged should switch to IndexedDB', fakeAsync(() => {

    // given
    component.selectedDataStorage = component.couchDB;
    vi.spyOn(dbService, 'useIndexedDb').mockResolvedValue(undefined);
    vi.spyOn(notificationService, 'onSuccess').mockReturnValue(undefined);

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
    vi.spyOn(dialogService, 'showConnectionDialog').mockImplementation((data: ConnectionDialogData) => {
      data.closedWithOK = false;
      return dialogRef;
    });
    vi.spyOn(couchDBService, 'initConnection').mockReturnValue(undefined);
    vi.spyOn(notificationService, 'onSuccess').mockReturnValue(undefined);

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
    vi.spyOn(couchDBService, 'getConnectionInfo').mockReturnValue(connectionInfo);
    const dialogRef = createConnectionDialogRef();
    vi.spyOn(dialogService, 'showConnectionDialog').mockImplementation((data: ConnectionDialogData) => {
      data.closedWithOK = true;
      return dialogRef;
    });
    vi.spyOn(couchDBService, 'initConnection').mockResolvedValue('connection establihed');
    vi.mocked(initBackendSpy).mockClear();
    vi.spyOn(notificationService, 'onSuccess').mockReturnValue(undefined);

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
    isIndexedDbInUseSpy.mockReturnValue(true);
    vi.spyOn(couchDBService, 'getConnectionInfo').mockReturnValue(connectionInfo);
    const dialogRef = createConnectionDialogRef();
    vi.spyOn(dialogService, 'showConnectionDialog').mockImplementation((data: ConnectionDialogData) => {
      data.connectionInfo.port = 999;
      data.closedWithOK = true;
      return dialogRef;
    });
    vi.spyOn(couchDBService, 'initConnection').mockResolvedValue('connection establihed');
    vi.mocked(initBackendSpy).mockClear();
    vi.spyOn(notificationService, 'onSuccess').mockReturnValue(undefined);

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
    vi.spyOn(couchDBService, 'getConnectionInfo').mockReturnValue(connectionInfo);
    const dialogRef = createConnectionDialogRef();
    vi.spyOn(dialogService, 'showConnectionDialog').mockImplementation((data: ConnectionDialogData) => {
      data.connectionInfo.port = 999;
      data.closedWithOK = true;
      return dialogRef;
    });
    vi.spyOn(couchDBService, 'initConnection').mockRejectedValue('connection failed');
    vi.mocked(initBackendSpy).mockClear();
    vi.spyOn(notificationService, 'onError').mockReturnValue(undefined);

    // when
    component.onDataStorageChanged(component.couchDB);
    flush();

    // then
    expect(dialogService.showConnectionDialog).toHaveBeenCalled();
    expect(couchDBService.initConnection).toHaveBeenCalled();
    expect(dbService.initBackend).not.toHaveBeenCalled();
    expect(notificationService.onError).toHaveBeenCalled();
    expect(component.selectedDataStorage).toBe(component.indexedDB);
    expect(component.ready).toBe(true);
    expect(component.showCouchDBTip()).toBe(true);
  }));

  it('#onDataStorageChanged should show error without reading scenes when connection to CouchDB fails while CouchDB is in use', fakeAsync(() => {

    // given
    component.selectedDataStorage = component.indexedDB;
    isIndexedDbInUseSpy.mockReturnValue(false);
    vi.spyOn(couchDBService, 'getConnectionInfo').mockReturnValue(connectionInfo);
    const dialogRef = createConnectionDialogRef();
    vi.spyOn(dialogService, 'showConnectionDialog').mockImplementation((data: ConnectionDialogData) => {
      data.connectionInfo.port = 999;
      data.closedWithOK = true;
      return dialogRef;
    });
    vi.spyOn(couchDBService, 'initConnection').mockRejectedValue('connection failed');
    findSceneInfosSpy.mockClear();
    vi.spyOn(notificationService, 'onError').mockReturnValue(undefined);

    // when
    component.onDataStorageChanged(component.couchDB);
    flush();

    // then
    expect(notificationService.onError).toHaveBeenCalled();
    expect(findSceneInfosSpy).not.toHaveBeenCalled();
    expect(component.ready).toBe(false);
  }));

  it('#onDataStorageChanged should show error when backend cannot be initialized', fakeAsync(() => {

    // given
    component.selectedDataStorage = component.indexedDB;
    vi.spyOn(couchDBService, 'getConnectionInfo').mockReturnValue(connectionInfo);
    const dialogRef = createConnectionDialogRef();
    vi.spyOn(dialogService, 'showConnectionDialog').mockImplementation((data: ConnectionDialogData) => {
      data.connectionInfo.port = 999;
      data.closedWithOK = true;
      return dialogRef;
    });
    vi.spyOn(couchDBService, 'initConnection').mockResolvedValue('connection establihed');
    initBackendSpy.mockRejectedValue('cannot initialize backend');
    vi.spyOn(notificationService, 'onError').mockReturnValue(undefined);

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
    isIndexedDbInUseSpy.mockReturnValue(false);
    vi.spyOn(couchDBService, 'getConnectionInfo').mockReturnValue(connectionInfo);
    const dialogRef = createConnectionDialogRef();
    vi.spyOn(dialogService, 'showConnectionDialog').mockImplementation((data: ConnectionDialogData) => {
      data.connectionInfo.port = 999;
      data.closedWithOK = true;
      return dialogRef;
    });
    vi.spyOn(couchDBService, 'initConnection').mockResolvedValue('connection establihed');
    vi.mocked(initBackendSpy).mockClear();
    findSceneInfosSpy.mockRejectedValue('backend not available');
    vi.spyOn(notificationService, 'onError').mockReturnValue(undefined);

    // when
    component.onDataStorageChanged(component.couchDB);
    flush();

    // then
    const bottomSheet = TestBed.inject(MatBottomSheet);
    expect(notificationService.onError).toHaveBeenCalledWith(bottomSheet, 'backend not available');
  }));

  it('#onDataStorageChanged should notify error when scene infos cannot be read after switching to IndexedDB', fakeAsync(() => {

    // given
    component.selectedDataStorage = component.couchDB;
    vi.spyOn(dbService, 'useIndexedDb').mockResolvedValue(undefined);
    findSceneInfosSpy.mockRejectedValue('backend not available');
    vi.spyOn(notificationService, 'onSuccess').mockReturnValue(undefined);
    vi.spyOn(notificationService, 'onError').mockReturnValue(undefined);

    // when
    component.onDataStorageChanged(component.indexedDB);
    flush();

    // then
    expect(notificationService.onError).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet), 'backend not available');
  }));

  it('#onDataStorageChanged should notify error and stay not ready when IndexedDB cannot be activated', fakeAsync(() => {

    // given
    component.selectedDataStorage = component.couchDB;
    vi.spyOn(dbService, 'useIndexedDb').mockRejectedValue('IndexedDB not available');
    vi.spyOn(notificationService, 'onSuccess').mockReturnValue(undefined);
    vi.spyOn(notificationService, 'onError').mockReturnValue(undefined);

    // when
    component.onDataStorageChanged(component.indexedDB);
    flush();

    // then
    expect(notificationService.onError).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet), 'IndexedDB not available');
    expect(notificationService.onSuccess).not.toHaveBeenCalled();
    expect(component.ready).toBe(false);
  }));

  it('#onDataStorageChanged should notify error when scene infos cannot be read after CouchDB connection failed', fakeAsync(() => {

    // given
    component.selectedDataStorage = component.indexedDB;
    vi.spyOn(couchDBService, 'getConnectionInfo').mockReturnValue(connectionInfo);
    const dialogRef = createConnectionDialogRef();
    vi.spyOn(dialogService, 'showConnectionDialog').mockImplementation((data: ConnectionDialogData) => {
      data.connectionInfo.port = 999;
      data.closedWithOK = true;
      return dialogRef;
    });
    vi.spyOn(couchDBService, 'initConnection').mockRejectedValue('connection failed');
    findSceneInfosSpy.mockRejectedValue('backend not available');
    vi.spyOn(notificationService, 'onError').mockReturnValue(undefined);

    // when
    component.onDataStorageChanged(component.couchDB);
    flush();

    // then
    const bottomSheet = TestBed.inject(MatBottomSheet);
    expect(notificationService.onError).toHaveBeenCalledWith(bottomSheet, 'connection failed');
    expect(notificationService.onError).toHaveBeenCalledWith(bottomSheet, 'backend not available');
  }));

  it('#showCouchDBConnectionDialog should notify error when scene infos cannot be read after dialog was canceled', fakeAsync(() => {

    // given
    component.selectedDataStorage = component.couchDB;
    const dialogRef = createConnectionDialogRef();
    vi.spyOn(dialogService, 'showConnectionDialog').mockImplementation((data: ConnectionDialogData) => {
      data.closedWithOK = false;
      return dialogRef;
    });
    findSceneInfosSpy.mockRejectedValue('backend not available');
    vi.spyOn(notificationService, 'onError').mockReturnValue(undefined);

    // when
    component.showCouchDBConnectionDialog();
    flush();

    // then
    expect(notificationService.onError).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet), 'backend not available');
  }));

  it('#showCouchDBConnectionDialog should not init connection when connection was not changed', fakeAsync(() => {

    // given
    component.selectedDataStorage = component.couchDB;
    isIndexedDbInUseSpy.mockReturnValue(false);
    const dialogRef = createConnectionDialogRef();
    vi.spyOn(dialogService, 'showConnectionDialog').mockImplementation((data: ConnectionDialogData) => {
      data.closedWithOK = true;
      return dialogRef;
    });
    vi.spyOn(couchDBService, 'initConnection').mockReturnValue(undefined);

    // when
    component.showCouchDBConnectionDialog();
    flush();

    // then
    expect(couchDBService.initConnection).not.toHaveBeenCalled();
  }));

  it('#showCouchDBConnectionDialog should not switch to IndexedDB when couchDB was selected and dialog is canceled', fakeAsync(() => {

    // given
    component.selectedDataStorage = component.couchDB;
    isIndexedDbInUseSpy.mockReturnValue(false);
    const dialogRef = createConnectionDialogRef();
    vi.spyOn(dialogService, 'showConnectionDialog').mockImplementation((data: ConnectionDialogData) => {
      data.closedWithOK = false;
      return dialogRef;
    });
    vi.spyOn(couchDBService, 'initConnection').mockReturnValue(undefined);

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

  it('should show shared header logo 40px high', () => {

    // when
    const host = render();

    // then
    const logo = host.querySelector<HTMLImageElement>('header .landing-logo');
    expect(new URL(logo.src).pathname).toBe('/assets/koialogo_textblack.png');
    expect(logo.getBoundingClientRect().height).toBe(40);
  });

  it('should keep scrollbar below header', () => {

    // when
    const host = render();

    // then
    const headerBottom = host.querySelector('.landing-header').getBoundingClientRect().bottom;
    expect(host.querySelector('.landing-scroll').getBoundingClientRect().top).toBeCloseTo(headerBottom, 0);
  });

  it('should register content as cdk scrollable', () => {

    // when
    render();

    // then
    const scrollable = fixture.debugElement.query(By.directive(CdkScrollable)).nativeElement as HTMLElement;
    expect(scrollable.classList).toContain('landing-scroll');
  });

  it('should show compact hero', () => {

    // when
    const host = render();

    // then
    expect(styleOf(host, '.front-hero').paddingTop).toBe('40px');
  });

  it('should show start panel in hero with collapsed storage options', () => {

    // when
    const host = render();

    // then
    const panel = host.querySelector('.front-hero .front-start-panel');
    expect(panel.querySelector('.front-actions #load_file_button')).toBeTruthy();
    expect(panel.querySelector('.front-storage-line')).toBeTruthy();
    expect(panel.querySelector('.front-storage')).toBeNull();
  });

  it('should expand storage options when Change storage is clicked', () => {

    // given
    const host = render();
    const change = host.querySelector<HTMLButtonElement>('.front-storage-change');

    // when
    change.click();
    fixture.detectChanges();

    // then
    expect(change.getAttribute('aria-expanded')).toBe('true');
    expect(host.querySelector('#front-storage-options .front-storage')).toBeTruthy();
  });

  it('should name browser storage in storage line', () => {

    // when
    const host = render();

    // then
    expect(textsOf(host, '.front-storage-line span')).toEqual(['Data is stored only in this browser (IndexedDB)']);
  });

  it('should name CouchDB in storage line', () => {

    // given
    component.selectedDataStorage = component.couchDB;

    // when
    const host = render();

    // then
    expect(textsOf(host, '.front-storage-line span')).toEqual(['Data is stored only in CouchDB']);
  });


  it('should recommend CouchDB while IndexedDB is in use', () => {

    // when
    const host = render();

    // then
    const tip = host.querySelector('.front-couchdb-tip');
    expect(tip.querySelector('h2').textContent).toBe('Recommended: use CouchDB');
    expect(tip.querySelector('a').getAttribute('href')).toContain('README.md#getting-started');
    expect(host.querySelector('.front-storage-hint')).toBeNull();
  });

  it('should show storage before CouchDB recommendation and start actions', () => {

    // given
    component.storageExpanded = true;

    // when
    const host = render();

    // then
    const sections = ['.front-storage-line', '.front-storage-options', '.front-couchdb-tip', '.front-actions']
      .map(selector => host.querySelector(selector));
    sections.slice(1).forEach((section, i) =>
      expect(sections[i].compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy());
  });

  it('should not recommend CouchDB while CouchDB is in use', () => {

    // given
    component.selectedDataStorage = component.couchDB;

    // when
    const host = render();

    // then
    expect(host.querySelector('.front-couchdb-tip')).toBeNull();
  });

  it('should hide CouchDB recommendation while connection dialog is open', () => {

    // given
    vi.spyOn(component, 'showCouchDBConnectionDialog').mockReturnValue(undefined);

    // when
    component.onDataStorageChanged(component.couchDB);
    const host = render();

    // then
    expect(host.querySelector('.front-couchdb-tip')).toBeNull();
  });

  it('should connect to CouchDB from recommendation', () => {

    // given
    const host = render();
    vi.spyOn(component, 'onDataStorageChanged').mockReturnValue(undefined);

    // when
    host.querySelector<HTMLButtonElement>('#connect_couchdb_button').click();

    // then
    expect(component.onDataStorageChanged).toHaveBeenCalledWith('CouchDB');
  });

  it('should dismiss CouchDB recommendation permanently', () => {

    // given
    const host = render();

    // when
    host.querySelector<HTMLButtonElement>('.front-couchdb-tip-dismiss').click();
    fixture.detectChanges();

    // then
    expect(host.querySelector('.front-couchdb-tip')).toBeNull();
    expect(localStorage.getItem(COUCHDB_TIP_DISMISSED)).toBe('true');
    expect(TestBed.createComponent(FrontComponent).componentInstance.couchDBTipDismissed).toBe(true);
  });

  it('should not consider CouchDB recommendation dismissed when local storage is not accessible', () => {

    // given
    localStorage.setItem(COUCHDB_TIP_DISMISSED, 'true');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });

    // when
    const front = TestBed.createComponent(FrontComponent).componentInstance;

    // then
    expect(front.couchDBTipDismissed).toBe(false);
  });

  it('should show setup guide link in storage hint when recommendation is dismissed', () => {

    // given
    component.couchDBTipDismissed = true;
    component.storageExpanded = true;

    // when
    const host = render();

    // then
    expect(host.querySelector('.front-storage-hint a').getAttribute('href')).toContain('README.md#getting-started');
  });

  it('should show monitor icon when IndexedDB is selected', () => {

    // when
    const host = render();

    // then
    expect(new URL(storageIcon(host).src).pathname).toBe('/assets/monitor.png');
  });

  it('should show CouchDB icon when CouchDB is selected', () => {

    // given
    component.selectedDataStorage = component.couchDB;

    // when
    const host = render();

    // then
    expect(new URL(storageIcon(host).src).pathname).toBe('/assets/couchdb.png');
  });

  it('should show only the first views guide below hero', () => {

    // when
    const host = render();

    // then
    expect(textsOf(host, '.landing-section h2')).toEqual(['Create your first views']);
  });

  it('should promise in lead that data is never sent to third-party servers', () => {

    // when
    const host = render();

    // then
    expect(host.querySelector('.landing-lead').textContent).toContain('never sent to any third-party server');
  });

  it('should mark selected storage active and pressed', () => {

    // when
    component.storageExpanded = true;
    const host = render();

    // then
    const [indexedDB, couchDB] = storageButtons(host);
    expect(indexedDB.getAttribute('data-state')).toBe('active');
    expect(indexedDB.getAttribute('aria-pressed')).toBe('true');
    expect(couchDB.getAttribute('data-state')).toBe('inactive');
    expect(couchDB.getAttribute('aria-pressed')).toBe('false');
  });

  it('should fill active storage button with strong accent', () => {

    // when
    component.storageExpanded = true;
    const host = render();

    // then
    const style = getComputedStyle(storageButtons(host)[0]);
    expect(style.backgroundColor).toBe('rgb(46, 125, 50)');
    expect(style.color).toBe('rgb(255, 255, 255)');
  });

  it('should outline inactive storage button', () => {

    // when
    component.storageExpanded = true;
    const host = render();

    // then
    expect(getComputedStyle(storageButtons(host)[1]).borderTopColor).toBe('rgb(138, 148, 166)');
  });

  it('should fill corrupt CouchDB button with error color', () => {

    // given
    component.selectedDataStorage = component.couchDB;
    component.ready = false;

    // when
    component.storageExpanded = true;
    const host = render();

    // then
    const couchDB = storageButtons(host)[1];
    expect(couchDB.getAttribute('data-state')).toBe('corrupt');
    expect(getComputedStyle(couchDB).backgroundColor).toBe('rgb(198, 40, 40)');
  });

  it('should switch storage when storage button is clicked', () => {

    // given
    component.storageExpanded = true;
    const host = render();
    vi.spyOn(component, 'onDataStorageChanged').mockReturnValue(undefined);

    // when
    storageButtons(host)[1].click();

    // then
    expect(component.onDataStorageChanged).toHaveBeenCalledWith('CouchDB');
  });

  it('should hide CouchDB settings when IndexedDB is selected', () => {

    // when
    const host = render();

    // then
    expect(host.querySelector('.front-storage-settings')).toBeNull();
  });

  it('should open CouchDB connection dialog when settings button is clicked', () => {

    // given
    component.selectedDataStorage = component.couchDB;
    component.storageExpanded = true;
    const host = render();
    vi.spyOn(component, 'showCouchDBConnectionDialog').mockReturnValue(undefined);

    // when
    host.querySelector<HTMLElement>('.front-storage-settings').click();

    // then
    expect(component.showCouchDBConnectionDialog).toHaveBeenCalled();
  });

  it('should continue with existing scenes when ready', () => {

    // when
    const host = render();

    // then
    const start = startButton(host);
    expect(start.getAttribute('href')).toMatch(/\/scenes$/);
    expect(start.getAttribute('aria-disabled')).toBe('false');
    expect(start.querySelector('mat-icon').textContent.trim()).toBe('play_circle_outline');
    expect(start.textContent).toContain('Continue with your 5 scenes');
  });

  it('should continue with single scene', () => {

    // given
    component.scenesCount = 1;

    // when
    const host = render();

    // then
    expect(startButton(host).textContent).toContain('Continue with your scene');
  });

  it('should offer loading a file and opening a shared scene as your data', () => {

    // when
    const host = render();

    // then
    const group = actionGroup(host, 'front_your_data_title');
    expect(group.querySelector('h2').textContent).toBe('Your data');
    expect(Array.from(group.querySelector('.front-actions-row').children).map(c => c.id)).toEqual(['load_file_button', 'scene_file_button']);
    expect(group.querySelector('#load_file_button').getAttribute('href')).toMatch(/\/scene$/);
    expect(group.querySelector('#load_file_button').textContent).toContain('Load a file');
    expect(group.querySelector('#load_file_button').textContent).toContain('CSV, Excel, JSON or log');
    expect(group.querySelector('#scene_file_button').textContent).toContain('Open a shared scene');
    expect(group.querySelector('#scene_file_button').textContent).toContain('Koia scene file (.koia)');
  });

  it('should offer sales and log sample as sample data', () => {

    // when
    const host = render();

    // then
    const group = actionGroup(host, 'front_sample_data_title');
    expect(group.querySelector('h2').textContent).toBe('Sample data');
    expect(Array.from(group.querySelector('.front-actions-row').children).map(c => c.id)).toEqual(['sample_button', 'log_sample_button']);
    expect(group.querySelector('#sample_button').textContent).toContain('Sales sample');
    expect(group.querySelector('#sample_button').textContent).toContain('Fruit sales per region');
    expect(group.querySelector('#log_sample_button').textContent).toContain('Log sample');
    expect(group.querySelector('#log_sample_button').textContent).toContain('App logs by level and host');
  });

  it('continue button should be last below both groups, row buttons stacked with same width on mobile', () => {

    // when
    const host = render();

    // then
    const actions = host.querySelector('.front-actions');
    const start = startButton(host);
    expect(actions.lastElementChild).toBe(start);
    expect(start.getBoundingClientRect().top).toBeGreaterThanOrEqual(host.querySelector('#log_sample_button').getBoundingClientRect().bottom);
    expect(actionButtonWidths(host)).toEqual(Array(4).fill(actions.getBoundingClientRect().width));
  });

  it('should show no green button and load a file from outline button when no scene exists', () => {

    // given
    component.scenesCount = 0;

    // when
    const host = render();

    // then
    const loadFile = host.querySelector('#load_file_button');
    expect(startButton(host)).toBeNull();
    expect(host.querySelector('.front-actions .landing-btn-accent')).toBeNull();
    expect(loadFile.classList).toContain('landing-btn-outline');
    expect(loadFile.getAttribute('href')).toMatch(/\/scene$/);
  });

  it('should disable sample button until ready', () => {

    // given
    component.ready = false;

    // when
    const host = render();

    // then
    expect((host.querySelector('#sample_button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('#openSample should open sample of current language and show its raw data', async () => {

    // given
    const openSpy = vi.spyOn(TestBed.inject(SampleSceneService), 'open').mockResolvedValue(undefined);
    const router = TestBed.inject(Router);
    const clearSpy = vi.spyOn(router.routeReuseStrategy as AppRouteReuseStrategy, 'clear').mockReturnValue(undefined);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    // when
    component.openSample(fruitSalesSampleOf);
    await vi.waitFor(() => expect(navigateSpy).toHaveBeenCalled());

    // then
    expect(openSpy).toHaveBeenCalledWith(fruitSalesSampleOf('en'));
    expect(clearSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(Route.RAWDATA);
  });

  it('#openSample should open sample of selected language', async () => {

    // given
    vi.spyOn(Storage.prototype, 'setItem').mockReturnValue(undefined);
    await TestBed.inject(LanguageService).use('ja');
    const openSpy = vi.spyOn(TestBed.inject(SampleSceneService), 'open').mockResolvedValue(undefined);
    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    // when
    component.openSample(fruitSalesSampleOf);
    await vi.waitFor(() => expect(navigateSpy).toHaveBeenCalled());

    // then
    expect(openSpy).toHaveBeenCalledWith(fruitSalesSampleOf('ja'));
  });

  it('#openSample should open log sample of current language and show its raw data', async () => {

    // given
    const openSpy = vi.spyOn(TestBed.inject(SampleSceneService), 'open').mockResolvedValue(undefined);
    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    // when
    (render().querySelector('#log_sample_button') as HTMLButtonElement).click();
    await vi.waitFor(() => expect(navigateSpy).toHaveBeenCalled());

    // then
    expect(openSpy).toHaveBeenCalledWith(appLogsSampleOf('en'));
    expect(navigateSpy).toHaveBeenCalledWith(Route.RAWDATA);
  });

  it('sample button should open fruit sales sample', () => {

    // given
    const openSpy = vi.spyOn(TestBed.inject(SampleSceneService), 'open').mockReturnValue(new Promise(() => undefined));

    // when
    (render().querySelector('#sample_button') as HTMLButtonElement).click();

    // then
    expect(openSpy).toHaveBeenCalledWith(fruitSalesSampleOf('en'));
  });

  it('should disable log sample button until ready', () => {

    // given
    component.ready = false;

    // when
    const host = render();

    // then
    const logSample = host.querySelector('#log_sample_button') as HTMLButtonElement;
    expect(logSample.disabled).toBe(true);
    expect(getComputedStyle(logSample).opacity).toBe('0.4');
  });

  it('#openSample should show progress on log sample button only while log sample is loading', () => {

    // given
    vi.spyOn(TestBed.inject(SampleSceneService), 'open').mockReturnValue(new Promise(() => undefined));

    // when
    component.openSample(appLogsSampleOf);
    const host = render();

    // then
    const logSample = host.querySelector('#log_sample_button') as HTMLButtonElement;
    const sample = host.querySelector('#sample_button') as HTMLButtonElement;
    expect(logSample.disabled).toBe(true);
    expect(logSample.getAttribute('aria-busy')).toBe('true');
    expect(getComputedStyle(logSample).opacity).toBe('1');
    expect(logSample.textContent).toContain('Loading log sample');
    expect(sample.disabled).toBe(true);
    expect(sample.getAttribute('aria-busy')).toBe('false');
    expect(sample.textContent).toContain('Sales sample');
    expect(sample.querySelector('mat-icon').textContent.trim()).toBe('shopping_basket');
    expect(sample.querySelector('.koia-spin')).toBeNull();
  });

  it('should keep storage selectable when not ready after failed CouchDB connection', () => {

    // given
    component.ready = false;
    component.storageExpanded = true;

    // when
    const host = render();

    // then
    expect(component.busy).toBe(true);
    expect(component.loadingAnyScene).toBe(false);
    expect((host.querySelector('.front-storage-change') as HTMLButtonElement).disabled).toBe(false);
    storageButtons(host).forEach(b => expect(b.disabled).toBe(false));
  });

  it('should show texts in selected language without reload', async () => {

    // given
    vi.spyOn(Storage.prototype, 'setItem').mockReturnValue(undefined);
    expect(render().querySelector('h1').textContent).toBe('Get started');

    // when
    await TestBed.inject(LanguageService).use('de');

    // then
    const host = render();
    expect(host.querySelector('h1').textContent).toBe('Loslegen');
    expect(host.querySelector('#sample_button').textContent).toContain('Verkaufsbeispiel');
  });

  it('should link introduction of selected language', async () => {

    // given
    vi.spyOn(Storage.prototype, 'setItem').mockReturnValue(undefined);
    expect(render().querySelector('.landing-nav a').getAttribute('href')).toBe('/intro/index.html');

    // when
    await TestBed.inject(LanguageService).use('ja');

    // then
    expect(render().querySelector('.landing-nav a').getAttribute('href')).toBe('/intro/index.ja.html');
    expect(component.introUrl()).toBe('/intro/index.ja.html');
  });

  it('should offer language selection in navigation', () => {

    // when
    const host = render();

    // then
    expect(host.querySelector('.landing-nav koia-language-select #but_language .language-code').textContent.trim()).toBe('EN');
  });

  it('#openSample should block start actions and storage while sample is loading', () => {

    // given
    vi.spyOn(TestBed.inject(SampleSceneService), 'open').mockReturnValue(new Promise(() => undefined));
    component.storageExpanded = true;

    // when
    component.openSample(fruitSalesSampleOf);
    const host = render();

    // then
    const sample = host.querySelector('#sample_button') as HTMLButtonElement;
    expect(sample.disabled).toBe(true);
    expect(sample.textContent).toContain('Loading sales sample');
    expect(startButton(host).getAttribute('aria-disabled')).toBe('true');
    expect((host.querySelector('.front-storage-change') as HTMLButtonElement).disabled).toBe(true);
    storageButtons(host).forEach(b => expect(b.disabled).toBe(true));
  });

  it('#openSample should notify error and unblock actions when sample cannot be opened', async () => {

    // given
    vi.spyOn(TestBed.inject(SampleSceneService), 'open').mockRejectedValue('no space left');
    const onErrorSpy = vi.spyOn(notificationService, 'onError').mockReturnValue(undefined);

    // when
    component.openSample(fruitSalesSampleOf);
    await vi.waitFor(() => expect(onErrorSpy).toHaveBeenCalled());

    // then
    expect(component.loadingSample).toBeUndefined();
    expect((render().querySelector('#sample_button') as HTMLButtonElement).disabled).toBe(false);
  });

  it('#click on open shared scene button should open file selection', () => {

    // given
    const host = render();
    const clickSpy = vi.spyOn(sceneFileInput(host), 'click').mockReturnValue(undefined);

    // when
    (host.querySelector('#scene_file_button') as HTMLButtonElement).click();

    // then
    expect(clickSpy).toHaveBeenCalled();
  });

  it('#openSceneFile should import selected file and show its raw data', async () => {

    // given
    const importSpy = vi.spyOn(TestBed.inject(SceneFileService), 'import').mockResolvedValue(undefined);
    const router = TestBed.inject(Router);
    const clearSpy = vi.spyOn(router.routeReuseStrategy as AppRouteReuseStrategy, 'clear').mockReturnValue(undefined);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const file = new File(['x'], 'sales.koia');
    const input = sceneFileInput(render());

    // when
    selectFile(input, file);
    await vi.waitFor(() => expect(navigateSpy).toHaveBeenCalled());

    // then
    expect(importSpy).toHaveBeenCalledWith(file, expect.any(AbortSignal));
    expect(clearSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(Route.RAWDATA);
    expect(input.value).toBe('');
  });

  it('#openSceneFile should block start actions and storage while scene file is imported', async () => {

    // given
    const importSpy = vi.spyOn(TestBed.inject(SceneFileService), 'import').mockReturnValue(new Promise(() => undefined));
    component.storageExpanded = true;

    // when
    selectFile(sceneFileInput(render()), new File(['x'], 'sales.koia'));
    const host = render();

    // then
    const button = host.querySelector('#scene_file_button') as HTMLButtonElement;
    expect(component.busy).toBe(true);
    expect(component.loadingAnyScene).toBe(true);
    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.textContent).toContain('Opening shared scene…');
    expect(startButton(host).getAttribute('aria-disabled')).toBe('true');
    storageButtons(host).forEach(b => expect(b.disabled).toBe(true));
    await vi.waitFor(() => expect(importSpy).toHaveBeenCalled());
  });

  it('open shared scene button should offer cancel as tooltip while import is cancelable', async () => {

    // given
    const importSpy = vi.spyOn(TestBed.inject(SceneFileService), 'import').mockReturnValue(new Promise(() => undefined));

    // when
    selectFile(sceneFileInput(render()), new File(['x'], 'sales.koia'));
    render();

    // then
    expect(fixture.debugElement.query(By.css('#scene_file_button')).injector.get(MatTooltip).message).toBe('Cancel');
    await vi.waitFor(() => expect(importSpy).toHaveBeenCalled());
  });

  it('open shared scene button should be disabled while backend is not ready', () => {

    // given
    component.ready = false;

    // when
    const host = render();

    // then
    expect((host.querySelector('#scene_file_button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('open shared scene button should be disabled while sample is loading', () => {

    // given
    component.loadingSample = fruitSalesSampleOf;

    // when
    const host = render();

    // then
    expect((host.querySelector('#scene_file_button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('#click on cancel should abort scene file import, warn and unblock actions', async () => {

    // given
    const importSpy = vi.spyOn(TestBed.inject(SceneFileService), 'import').mockImplementation((_file, signal) =>
      new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason))));
    const onWarningSpy = vi.spyOn(notificationService, 'onWarning').mockReturnValue(undefined);
    selectFile(sceneFileInput(render()), new File(['x'], 'sales.koia'));
    await vi.waitFor(() => expect(importSpy).toHaveBeenCalled());

    // when
    sceneFileButton(render()).click();
    await vi.waitFor(() => expect(onWarningSpy).toHaveBeenCalled());

    // then
    expect(onWarningSpy.mock.calls[0][1]).toBe('Opening the shared scene was canceled');
    expect(component.sceneFileOpener.importing).toBe(false);
    const host = render();
    expect(host.querySelector('#scene_file_button .koia-spin')).toBeNull();
    expect(sceneFileButton(host).disabled).toBe(false);
  });

  it('#click on spinning button should keep spinning while import is still aborting', async () => {

    // given
    const importSpy = vi.spyOn(TestBed.inject(SceneFileService), 'import').mockReturnValue(new Promise(() => undefined));
    selectFile(sceneFileInput(render()), new File(['x'], 'sales.koia'));
    await vi.waitFor(() => expect(importSpy).toHaveBeenCalled());

    // when
    sceneFileButton(render()).click();

    // then
    const host = render();
    expect(component.sceneFileOpener.cancelable).toBe(false);
    expect(host.querySelector('#scene_file_button .koia-spin')).not.toBeNull();
  });

  it('#openSceneFile should notify error and unblock actions when import fails', async () => {

    // given
    vi.spyOn(TestBed.inject(SceneFileService), 'import').mockRejectedValue('sales.koia is not a Koia scene file');
    const onErrorSpy = vi.spyOn(notificationService, 'onError').mockReturnValue(undefined);

    // when
    selectFile(sceneFileInput(render()), new File(['x'], 'sales.koia'));
    await vi.waitFor(() => expect(onErrorSpy).toHaveBeenCalled());

    // then
    expect(onErrorSpy.mock.calls[0][1]).toBe('sales.koia is not a Koia scene file');
    expect(component.sceneFileOpener.importing).toBe(false);
    const host = render();
    expect((host.querySelector('#scene_file_button') as HTMLButtonElement).disabled).toBe(false);
    expect(host.querySelector('#scene_file_button .koia-spin')).toBeNull();
  });

  it('#openSample should clear cached views when active scene changed before failure', async () => {

    // given
    vi.spyOn(dbService, 'getActiveScene').mockReturnValueOnce(SceneFactory.createScene('1', [])).mockReturnValue(undefined);
    vi.spyOn(TestBed.inject(SampleSceneService), 'open').mockRejectedValue('no space left');
    const clearSpy = vi.spyOn(TestBed.inject(Router).routeReuseStrategy as AppRouteReuseStrategy, 'clear').mockReturnValue(undefined);
    const onErrorSpy = vi.spyOn(notificationService, 'onError').mockReturnValue(undefined);

    // when
    component.openSample(fruitSalesSampleOf);
    await vi.waitFor(() => expect(onErrorSpy).toHaveBeenCalled());

    // then
    expect(clearSpy).toHaveBeenCalled();
  });

  it('#openSample should keep cached views when sample cannot be opened before scene changed', async () => {

    // given
    vi.spyOn(dbService, 'getActiveScene').mockReturnValue(SceneFactory.createScene('1', []));
    vi.spyOn(TestBed.inject(SampleSceneService), 'open').mockRejectedValue('no space left');
    const clearSpy = vi.spyOn(TestBed.inject(Router).routeReuseStrategy as AppRouteReuseStrategy, 'clear').mockReturnValue(undefined);
    const onErrorSpy = vi.spyOn(notificationService, 'onError').mockReturnValue(undefined);

    // when
    component.openSample(fruitSalesSampleOf);
    await vi.waitFor(() => expect(onErrorSpy).toHaveBeenCalled());

    // then
    expect(clearSpy).not.toHaveBeenCalled();
  });

  it('#ngOnDestroy should abort running scene file import', async () => {

    // given
    const importSpy = vi.spyOn(TestBed.inject(SceneFileService), 'import').mockReturnValue(new Promise(() => undefined));
    selectFile(sceneFileInput(render()), new File(['x'], 'sales.koia'));
    await vi.waitFor(() => expect(importSpy).toHaveBeenCalled());

    // when
    fixture.destroy();

    // then
    expect(importSpy.mock.calls[0][1].aborted).toBe(true);
  });

  it('#ngOnDestroy should not show raw data when sample opens after destroy', async () => {

    // given
    let completeOpen: () => void;
    vi.spyOn(TestBed.inject(SampleSceneService), 'open').mockReturnValue(new Promise<void>(resolve => completeOpen = resolve));
    const router = TestBed.inject(Router);
    const clearSpy = vi.spyOn(router.routeReuseStrategy as AppRouteReuseStrategy, 'clear').mockReturnValue(undefined);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    component.openSample(fruitSalesSampleOf);

    // when
    fixture.destroy();
    completeOpen();
    await vi.waitFor(() => expect(clearSpy).toHaveBeenCalled());

    // then
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('#ngOnDestroy should not fail when ngOnInit did not run', () => {

    // given
    const uninitializedFixture = TestBed.createComponent(FrontComponent);

    // when
    const destroy = () => uninitializedFixture.destroy();

    // then
    expect(destroy).not.toThrow();
  });

  function sceneFileInput(host: HTMLElement): HTMLInputElement {
    return host.querySelector<HTMLInputElement>('#scene_file_input');
  }

  function sceneFileButton(host: HTMLElement): HTMLButtonElement {
    return host.querySelector<HTMLButtonElement>('#scene_file_button');
  }



  it('should disable start button until ready', () => {

    // given
    component.ready = false;

    // when
    const host = render();

    // then
    const start = startButton(host);
    const style = getComputedStyle(start);
    expect(start.hasAttribute('href')).toBe(false);
    expect(start.getAttribute('role')).toBe('link');
    expect(start.getAttribute('aria-disabled')).toBe('true');
    expect(style.pointerEvents).toBe('none');
    expect(style.opacity).toBe('0.4');
  });


  it('should open external links in new tab without opener', () => {

    // when
    const host = render();

    // then
    expect(findUnsafeExternalLinks(host)).toEqual([]);
  });

  it('should hide secondary navigation on mobile', () => {

    // when
    const host = render();

    // then
    Array.from(host.querySelectorAll('.landing-nav-secondary'))
      .forEach(l => expect(getComputedStyle(l).display).toBe('none'));
  });

  it('should end every tile with its padding only', () => {

    // when
    const host = render();

    // then
    expect(stylesOf(host, '.landing-tile > :last-child').map(s => s.marginBottom)).toEqual(Array(5).fill('0px'));
  });

  describe('on desktop', () => {

    beforeAll(() => page.viewport(1280, 800));

    afterAll(() => page.viewport(414, 896));

    it('should show start button without scrolling', () => {

      // when
      const host = render();

      // then
      expect(startButton(host).getBoundingClientRect().bottom).toBeLessThanOrEqual(800);
    });

    it('your data and sample buttons should share one row per group', () => {

      // when
      const host = render();

      // then
      host.querySelectorAll('.front-action-group').forEach(group => expect(rowCountOf(group, '.front-actions-row .landing-btn')).toBe(1));
      expect(startButton(host).getBoundingClientRect().top).toBeGreaterThan(host.querySelector('#log_sample_button').getBoundingClientRect().bottom);
    });

    it('continue button should fit its content with height of buttons above, centered with larger gap', () => {

      // when
      const host = render();

      // then
      const actions = host.querySelector('.front-actions');
      const start = startButton(host);
      const startRect = start.getBoundingClientRect();
      const logSampleRect = host.querySelector('#log_sample_button').getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(start);
      const style = getComputedStyle(start);
      const contentWidth = range.getBoundingClientRect().width
        + parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
        + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
      expect(startRect.height).toBeCloseTo(logSampleRect.height, 0);
      expect(startRect.width).toBeCloseTo(contentWidth, 0);
      expect(startRect.width).toBeLessThan(actions.getBoundingClientRect().width);
      expect(Math.abs(leftInsetOf(start, actions) - rightInsetOf(start, actions))).toBeLessThanOrEqual(1);
      expect(startRect.top - logSampleRect.bottom).toBeCloseTo(24, 0);
    });

    it('should show language selection at right end of header', () => {

      // when
      const host = render();

      // then
      expect(host.querySelector('.landing-nav').lastElementChild.tagName).toBe('KOIA-LANGUAGE-SELECT');
      expect(rightInsetOf(host.querySelector('#but_language'), host.querySelector('.landing-header'))).toBe(8);
    });
  });

  function render(): HTMLElement {
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  function styleOf(host: HTMLElement, selector: string): CSSStyleDeclaration {
    return getComputedStyle(host.querySelector(selector));
  }

  function storageIcon(host: HTMLElement): HTMLImageElement {
    return host.querySelector<HTMLImageElement>('.front-storage-line .front-storage-icon');
  }

  function storageButtons(host: HTMLElement): HTMLButtonElement[] {
    return Array.from(host.querySelectorAll<HTMLButtonElement>('.front-storage-option'));
  }

  function actionButtonWidths(host: HTMLElement): number[] {
    return Array.from(host.querySelectorAll('.front-actions-row .landing-btn')).map(b => b.getBoundingClientRect().width);
  }

  function actionGroup(host: HTMLElement, titleId: string): HTMLElement {
    return host.querySelector<HTMLElement>(`.front-action-group[aria-labelledby="${titleId}"]`);
  }

  function startButton(host: HTMLElement): HTMLAnchorElement {
    return host.querySelector<HTMLAnchorElement>('#start_button');
  }

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

describe('FrontComponent (launch params)', () => {

  const queryParamMap$ = new Subject<QueryParams>();
  let fixture: ComponentFixture<FrontComponent>;

  beforeEach(waitForAsync(() => {
    vi.spyOn(console, 'log').mockReturnValue(undefined);
    dbService = new DBService(couchDBService, null);
    configureTestingModule(new QueryParams(), null);
    TestBed.overrideProvider(ActivatedRoute, { useValue: { queryParamMap: queryParamMap$, fragment: of(null) } });
    TestBed.compileComponents();
    initBackendSpy = vi.spyOn(dbService, 'initBackend').mockResolvedValue(undefined);
    vi.spyOn(dbService, 'isIndexedDbInUse').mockReturnValue(true);
    vi.spyOn(dbService, 'findSceneInfos').mockResolvedValue([]);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FrontComponent);
    fixture.detectChanges();
  });

  it('#ngOnDestroy should stop handling launch params', () => {

    // given
    queryParamMap$.next(new QueryParams());

    // when
    fixture.destroy();
    queryParamMap$.next(new QueryParams());

    // then
    expect(initBackendSpy).toHaveBeenCalledTimes(1);
  });
});

describe('FrontComponent (external invocation)', () => {

  let component: FrontComponent;
  let router: Router;

  beforeEach(waitForAsync(() => {
    vi.spyOn(console, 'log').mockReturnValue(undefined);
    dbService = new DBService(couchDBService, null);
    configureTestingModule(createQueryParams(), null);
    TestBed.compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    const fixture = TestBed.createComponent(FrontComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(couchDBService, 'initLaunchConnection').mockResolvedValue('connection established');
    initBackendSpy = vi.spyOn(dbService, 'initBackend').mockResolvedValue(undefined);
    vi.spyOn(dbService, 'activateScene').mockResolvedValue(SceneFactory.createScene('1', []));
    vi.spyOn(router, 'navigateByUrl').mockReturnValue(undefined);
    vi.spyOn(TestBed.inject(Location), 'replaceState').mockReturnValue(undefined);
    fixture.detectChanges();
    flush();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should activate scene and navigate to raw data view', () => {
    expect(couchDBService.initLaunchConnection).toHaveBeenCalledWith(
      <ConnectionInfo>{ protocol: 'HTTP', host: 'localhost', port: 5984, user: 'test', password: 'secret' });
    expect(dbService.initBackend).toHaveBeenCalled();
    expect(dbService.activateScene).toHaveBeenCalledWith(sceneID);
    expect(router.navigateByUrl).toHaveBeenCalledWith(Route.RAWDATA, { replaceUrl: true });
  });

  it('#ngOnInit should notify error when backend cannot be initialized', fakeAsync(() => {

    // given
    initBackendSpy.mockRejectedValue(undefined);
    vi.spyOn(notificationService, 'onError').mockReturnValue(undefined);

    // when
    component.ngOnInit();
    flush();

    // then
    expect(notificationService.onError).toHaveBeenCalled();
  }));

  it('#ngOnInit should notify error when CouchDB connection cannot be established', fakeAsync(() => {

    // given
    vi.mocked(couchDBService.initLaunchConnection).mockRejectedValue('connection refused');
    vi.spyOn(notificationService, 'onError').mockReturnValue(undefined);
    vi.mocked(initBackendSpy).mockClear();

    // when
    component.ngOnInit();
    flush();

    // then
    expect(notificationService.onError).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet), expect.stringContaining('connection refused'));
    expect(dbService.initBackend).not.toHaveBeenCalled();
  }));

  it('should clear cached views before activating scene of external invocation', fakeAsync(() => {

    // given
    const clearSpy = vi.spyOn(router.routeReuseStrategy as AppRouteReuseStrategy, 'clear').mockReturnValue(undefined);
    initBackendSpy.mockClear();

    // when
    component.ngOnInit();
    flush();

    // then
    expect(clearSpy).toHaveBeenCalled();
    expect(clearSpy.mock.invocationCallOrder[0]).toBeLessThan(initBackendSpy.mock.invocationCallOrder[0]);
  }));

  it('#ngOnInit should notify CouchDB failure instead of activating scene when browser storage is used instead', fakeAsync(() => {

    // given
    initBackendSpy.mockResolvedValue({ couchDBError: 'unreachable' });
    vi.mocked(dbService.activateScene).mockClear();
    vi.spyOn(notificationService, 'onError').mockReturnValue(undefined);

    // when
    component.ngOnInit();
    flush();

    // then
    expect(notificationService.onError).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet),
      'cannot show raw data of scene with _id ' + sceneID + ':\n\n' + 'CouchDB cannot be used, data is stored in this browser (IndexedDB) instead: unreachable');
    expect(dbService.activateScene).not.toHaveBeenCalled();
  }));

  it('should replace launch URL in history after failed external invocation', fakeAsync(() => {

    // given
    vi.mocked(couchDBService.initLaunchConnection).mockRejectedValue('connection refused');
    vi.spyOn(notificationService, 'onError').mockReturnValue(undefined);

    // when
    component.ngOnInit();
    flush();

    // then
    expect(TestBed.inject(Location).replaceState).toHaveBeenCalledWith('/front');
  }));
});

describe('FrontComponent (external invocation through URL fragment)', () => {

  const launchParamsService = { paramsOf: vi.fn() };
  let component: FrontComponent;
  let router: Router;

  beforeEach(waitForAsync(() => {
    vi.spyOn(console, 'log').mockReturnValue(undefined);
    dbService = new DBService(couchDBService, null);
    launchParamsService.paramsOf.mockReset().mockReturnValue(createQueryParams());
    configureTestingModule(new QueryParams(), 'host=localhost', { provide: LaunchParamsService, useValue: launchParamsService });
    TestBed.compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    const fixture = TestBed.createComponent(FrontComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(couchDBService, 'initLaunchConnection').mockResolvedValue('connection established');
    vi.spyOn(dbService, 'initBackend').mockResolvedValue(undefined);
    vi.spyOn(dbService, 'activateScene').mockResolvedValue(SceneFactory.createScene('1', []));
    vi.spyOn(router, 'navigateByUrl').mockReturnValue(undefined);
    vi.spyOn(TestBed.inject(Location), 'replaceState').mockReturnValue(undefined);
    fixture.detectChanges();
    flush();
  }));

  it('should pass query params and fragment to launch params service', () => {
    expect(launchParamsService.paramsOf).toHaveBeenCalledWith(expect.any(QueryParams), 'host=localhost');
  });

  it('should activate scene of fragment params and navigate to raw data view', () => {
    expect(couchDBService.initLaunchConnection).toHaveBeenCalledWith(
      <ConnectionInfo>{ protocol: 'HTTP', host: 'localhost', port: 5984, user: 'test', password: 'secret' });
    expect(dbService.initBackend).toHaveBeenCalled();
    expect(dbService.activateScene).toHaveBeenCalledWith(sceneID);
    expect(router.navigateByUrl).toHaveBeenCalledWith(Route.RAWDATA, { replaceUrl: true });
  });

  it.each([
    { invalid: 'port', changes: { [QueryParamExtractor.PORT]: '5984x' }, error: 'invalid port: 5984x' },
    { invalid: 'password', changes: { [QueryParamExtractor.PASSWORD]: 'a!' }, error: 'invalid pw: not Base64 encoded' }
  ])('#ngOnInit should notify error and replace launch URL when $invalid is invalid', ({ changes, error }) => fakeAsync(() => {

    // given
    launchParamsService.paramsOf.mockReturnValue(createQueryParams(changes));
    vi.mocked(couchDBService.initLaunchConnection).mockClear();
    vi.spyOn(notificationService, 'onError').mockReturnValue(undefined);

    // when
    component.ngOnInit();
    flush();

    // then
    expect(notificationService.onError).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet),
      'cannot show raw data of scene with _id ' + sceneID + ':\n\nError: ' + error);
    expect(TestBed.inject(Location).replaceState).toHaveBeenCalledWith('/front');
    expect(couchDBService.initLaunchConnection).not.toHaveBeenCalled();
  })());

  it('#ngOnInit should init backend when params with invalid password carry no scene ID', fakeAsync(() => {

    // given
    launchParamsService.paramsOf.mockReturnValue(createQueryParams({ [QueryParamExtractor.PASSWORD]: 'a!', [QueryParamExtractor.SCENE_ID]: undefined }));
    vi.mocked(couchDBService.initLaunchConnection).mockClear();
    vi.mocked(dbService.initBackend).mockClear();
    vi.spyOn(dbService, 'findSceneInfos').mockResolvedValue([]);

    // when
    component.ngOnInit();
    flush();

    // then
    expect(dbService.initBackend).toHaveBeenCalledWith(false);
    expect(couchDBService.initLaunchConnection).not.toHaveBeenCalled();
  }));
});
