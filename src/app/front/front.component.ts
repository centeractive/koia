import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ActivatedRoute, Router } from '@angular/router';
import { AppRouteReuseStrategy } from 'app/app-route-reuse-strategy';
import { AbstractComponent } from 'app/shared/component/abstract.component';
import { ConnectionInfo, Route } from 'app/shared/model';
import { appLogsSampleOf } from 'app/shared/samples/app-logs.sample';
import { fruitSalesSampleOf } from 'app/shared/samples/fruit-sales.sample';
import { SampleDef } from 'app/shared/samples/sample-data';
import { SampleSceneService } from 'app/shared/samples/sample-scene.service';
import { SceneFileService } from 'app/shared/scene-file/scene-file.service';
import { SceneFileOpener } from 'app/shared/scene-file/scene-file-opener';
import { DialogService, NotificationService, messageOf } from 'app/shared/services';
import { CouchDBFallback, DBService } from 'app/shared/services/backend';
import { CouchDBService } from 'app/shared/services/backend/couchdb';
import { Language, LanguageService } from 'app/shared/services/language';
import { CommonUtils, QueryParamExtractor } from 'app/shared/utils';
import { Subscription, combineLatest, firstValueFrom } from 'rxjs';
import { ConnectionDialogData } from './connection-dialog/connection-dialog.component';
import { LaunchParamsService } from './launch-params.service';

@Component({
    selector: 'koia-front',
    templateUrl: './front.component.html',
    styleUrls: ['./front.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class FrontComponent extends AbstractComponent implements OnInit, OnDestroy {

  readonly indexedDB = 'IndexedDB';
  readonly couchDB = 'CouchDB';
  readonly urlScene = '/' + Route.SCENE;
  readonly urlScenes = '/' + Route.SCENES;
  private static readonly COUCHDB_TIP_DISMISSED = 'koia.front.couchdbTipDismissed';

  dataStorages = [this.indexedDB, this.couchDB];
  selectedDataStorage: string;
  ready = false;
  scenesCount: number;
  storageExpanded = false;
  readonly fruitSalesSampleOf = fruitSalesSampleOf;
  readonly appLogsSampleOf = appLogsSampleOf;

  /**
   * the sample being loaded, undefined while no sample is being loaded
   */
  loadingSample: (language: Language) => SampleDef;
  readonly sceneFileOpener: SceneFileOpener;
  couchDBTipDismissed = FrontComponent.readCouchDBTipDismissed();

  private launchSubscription = Subscription.EMPTY;
  private destroyed = false;

  constructor(private router: Router, private activatedRoute: ActivatedRoute, bottomSheet: MatBottomSheet, private dbService: DBService,
    private couchDBService: CouchDBService, private dialogService: DialogService, private sampleSceneService: SampleSceneService,
    notificationService: NotificationService, private languageService: LanguageService, private launchParamsService: LaunchParamsService,
    private location: Location, sceneFileService: SceneFileService) {
    super(bottomSheet, notificationService);
    this.sceneFileOpener = new SceneFileOpener(sceneFileService, router, this);
  }

  ngOnInit(): void {
    this.launchSubscription = combineLatest([this.activatedRoute.queryParamMap, this.activatedRoute.fragment]).subscribe(([params, fragment]) => {
      const queryParamExtractor = new QueryParamExtractor(this.launchParamsService.paramsOf(params, fragment));
      if (queryParamExtractor.hasCouchDBConnectionParams() && queryParamExtractor.getSceneID()) {
        this.handleExternalInvocation(queryParamExtractor);
      } else {
        this.dbService.initBackend(false)
          .then(fallback => {
            if (fallback && this.couchDBService.isConnectionSaved()) {
              this.notifyWarning(this.couchDBUnusableMessage(fallback));
            }
            return this.init();
          })
          .catch(err => this.notifyError(err));
      }
    });
  }

  /**
   * web-app was invoked externally with a URL fragment (or query string) that carries CouchDB connection information and a [[Scene]] _id
   */
  private handleExternalInvocation(queryParamExtractor: QueryParamExtractor): void {
    const sceneID = queryParamExtractor.getSceneID();
    Promise.resolve()
      .then(() => this.couchDBService.initLaunchConnection(queryParamExtractor.getCouchDBConnectionInfo()))
      .then(() => {
        this.clearCachedViews();
        return this.dbService.initBackend(true);
      })
      .then(fallback => {
        if (fallback) {
          throw this.couchDBUnusableMessage(fallback);
        }
        return this.dbService.activateScene(sceneID);
      })
      .then(() => this.router.navigateByUrl(Route.RAWDATA, { replaceUrl: true }))
      .catch(err => {
        this.location.replaceState('/' + Route.FRONT);
        this.notifyError(this.languageService.instant('front.externalInvocationFailed', { id: sceneID }) + ':\n\n' + err);
      });
  }

  onDataStorageChanged(dataStorage: string): void {
    if (this.selectedDataStorage !== dataStorage) {
      this.ready = false;
      this.selectedDataStorage = dataStorage;
      if (this.selectedDataStorage === this.couchDB) {
        this.showCouchDBConnectionDialog();
      } else {
        this.clearCachedViews();
        this.dbService.useIndexedDb()
          .then(() => {
            this.notifySuccess(this.languageService.instant('front.storage.switchedTo', { storage: this.indexedDB }));
            this.ready = true;
            return this.init();
          })
          .catch(err => this.notifyError(err));
      }
    }
  }

  /**
   * @returns the URL of the introduction page in the current language
   */
  introUrl(): string {
    const language = this.languageService.current();
    return language === 'en' ? '/intro/index.html' : '/intro/index.' + language + '.html';
  }

  /**
   * start actions and storage selection are blocked while the backend is not ready or a sample or scene file is being loaded
   */
  get busy(): boolean {
    return !this.ready || this.loadingAnyScene;
  }

  /**
   * the button stays enabled while a scene file is imported, so that a click can cancel it
   */
  get sceneFileButtonDisabled(): boolean {
    return !this.ready || !!this.loadingSample;
  }

  /**
   * storage selection is blocked while a sample or scene file is being loaded only, it must remain possible after a failed CouchDB
   * connection
   */
  get loadingAnyScene(): boolean {
    return !!this.loadingSample || this.sceneFileOpener.importing;
  }

  /**
   * inserts the specified sample scene of the current language unless it exists already and shows its raw data
   */
  openSample(sampleOf: (language: Language) => SampleDef): void {
    this.loadingSample = sampleOf;
    const activeScene = this.dbService.getActiveScene();
    this.sampleSceneService.open(sampleOf(this.languageService.current()))
      .then(() => this.showRawData())
      .catch(err => {
        this.routeReuseStrategy().clearIfSceneChanged(activeScene, this.dbService.getActiveScene());
        this.loadingSample = undefined;
        this.notifyError(err);
      });
  }

  showCouchDBConnectionDialog(): void {
    const data = new ConnectionDialogData(this.couchDBService.getConnectionInfo());
    const dialogRef = this.dialogService.showConnectionDialog(data);
    firstValueFrom(dialogRef.afterClosed()).then(() => this.onCouchDBConnectionDialogClosed(data));
  }

  private onCouchDBConnectionDialogClosed(data: ConnectionDialogData): void {
    if (data.closedWithOK) {
      if (this.dbService.isIndexedDbInUse() || !CommonUtils.compare(data.connectionInfo, this.couchDBService.getConnectionInfo())) {
        this.initCouchDBConnection(data.connectionInfo);
      }
    } else if (this.dbService.isIndexedDbInUse()) {
      this.initOrNotifyError();
    }
  }

  private initCouchDBConnection(connectionInfo: ConnectionInfo): void {
    this.couchDBService.initConnection(connectionInfo)
      .then(msg => {
        this.clearCachedViews();
        this.dbService.initBackend(true)
          .then(fallback => fallback ? this.couchDBFallbackUsed(fallback) : this.couchDBConnectionSucceeded(msg))
          .catch(err => this.couchDBConnectionFailed(err));
      })
      .catch(couchDBErr => this.couchDBConnectionFailed(couchDBErr));
  }

  private couchDBConnectionSucceeded(msg: string): void {
    this.ready = true;
    this.notifySuccess(msg);
    this.initOrNotifyError();
  }

  private couchDBFallbackUsed(fallback: CouchDBFallback): void {
    this.notifyWarning(this.couchDBUnusableMessage(fallback));
    this.initOrNotifyError();
  }

  private couchDBUnusableMessage(fallback: CouchDBFallback): string {
    return this.languageService.instant('front.storage.couchDBUnusable', { error: messageOf(fallback.couchDBError) });
  }

  private couchDBConnectionFailed(error: string | object): void {
    this.ready = false;
    this.notifyError(error);
    if (this.dbService.isIndexedDbInUse()) {
      this.initOrNotifyError();
    }
  }

  /**
   * recommends CouchDB as long as the browser's IndexedDB is in use, unless the user dismissed the recommendation
   */
  showCouchDBTip(): boolean {
    return this.ready && this.selectedDataStorage === this.indexedDB && !this.couchDBTipDismissed;
  }

  dismissCouchDBTip(): void {
    this.couchDBTipDismissed = true;
    try {
      localStorage.setItem(FrontComponent.COUCHDB_TIP_DISMISSED, 'true');
    } catch {
      // storage unavailable, dismissed for this visit only
    }
  }

  private static readCouchDBTipDismissed(): boolean {
    try {
      return localStorage.getItem(FrontComponent.COUCHDB_TIP_DISMISSED) === 'true';
    } catch {
      return false;
    }
  }

  /**
   * the loaded scene is active now, unless this page was left meanwhile
   */
  private showRawData(): Promise<boolean> {
    this.clearCachedViews();
    return this.destroyed ? Promise.resolve(false) : this.router.navigateByUrl(Route.RAWDATA);
  }

  /**
   * cached views belong to the scene that was active before
   */
  private clearCachedViews(): void {
    this.routeReuseStrategy().clear();
  }

  private routeReuseStrategy(): AppRouteReuseStrategy {
    return this.router.routeReuseStrategy as AppRouteReuseStrategy;
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.launchSubscription.unsubscribe();
    this.sceneFileOpener.destroy();
  }

  private initOrNotifyError(): void {
    this.init().catch(err => this.notifyError(err));
  }

  private init(): Promise<void> {
    this.selectedDataStorage = this.dbService.isIndexedDbInUse() ? this.indexedDB : this.couchDB;
    return this.dbService.findSceneInfos()
      .then(sceneInfos => {
        this.scenesCount = sceneInfos.length;
        this.ready = true;
      });
  }

  colorOf(dataStorage: string): string {
    if (dataStorage === this.couchDB) {
      if (this.selectedDataStorage === this.couchDB) {
        return this.ready ? 'active' : 'corrupt';
      }
      return 'inactive';
    }
    return this.selectedDataStorage === this.indexedDB ? 'active' : 'inactive';
  }
}
