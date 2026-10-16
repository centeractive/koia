import { Component, OnInit, ChangeDetectionStrategy, Inject, LOCALE_ID } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ActivatedRoute, Router } from '@angular/router';
import { AppRouteReuseStrategy } from 'app/app-route-reuse-strategy';
import { AbstractComponent } from 'app/shared/component/abstract.component';
import { ConnectionInfo, Route } from 'app/shared/model';
import { fruitSalesSampleOf } from 'app/shared/samples/fruit-sales.sample';
import { sampleLanguageOf } from 'app/shared/samples/sample-language';
import { SampleSceneService } from 'app/shared/samples/sample-scene.service';
import { DialogService, NotificationService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { CouchDBService } from 'app/shared/services/backend/couchdb';
import { CommonUtils, QueryParamExtractor } from 'app/shared/utils';
import { firstValueFrom } from 'rxjs';
import { ConnectionDialogData } from './connection-dialog/connection-dialog.component';

@Component({
    selector: 'koia-front',
    templateUrl: './front.component.html',
    styleUrls: ['./front.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class FrontComponent extends AbstractComponent implements OnInit {

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
  loadingSample = false;
  couchDBTipDismissed = FrontComponent.readCouchDBTipDismissed();

  constructor(private router: Router, private activatedRoute: ActivatedRoute, bottomSheet: MatBottomSheet, private dbService: DBService,
    private couchDBService: CouchDBService, private dialogService: DialogService, private sampleSceneService: SampleSceneService,
    notificationService: NotificationService, @Inject(LOCALE_ID) private localeId: string) {
    super(bottomSheet, notificationService);
  }

  ngOnInit(): void {
    this.activatedRoute.queryParamMap.subscribe(params => {
      const queryParamExtractor = new QueryParamExtractor(params);
      if (queryParamExtractor.getCouchDBConnectionInfo() && queryParamExtractor.getSceneID()) {
        this.handleExternalInvocation(queryParamExtractor);
      } else {
        this.dbService.initBackend(false)
          .then(() => this.init())
          .catch(err => this.notifyError(err));
      }
    });
  }

  /**
   * web-app was invoked externally with a query string that carries CouchDB connection information and a [[Scene]] _id
   */
  private handleExternalInvocation(queryParamExtractor: QueryParamExtractor): void {
    this.couchDBService.initConnection(queryParamExtractor.getCouchDBConnectionInfo())
      .then(() => this.dbService.initBackend(true)
        .then(() => this.dbService.activateScene(queryParamExtractor.getSceneID())
          .then(() => this.router.navigateByUrl(Route.RAWDATA)))
        .catch(err => this.notifyError('cannot show raw data of scene with _id ' + queryParamExtractor.getSceneID() + ':\n\n' + err)));
  }

  onDataStorageChanged(dataStorage: string): void {
    if (this.selectedDataStorage !== dataStorage) {
      this.ready = false;
      this.selectedDataStorage = dataStorage;
      if (this.selectedDataStorage === this.couchDB) {
        this.showCouchDBConnectionDialog();
      } else {
        this.dbService.useIndexedDb()
          .then(() => {
            this.init().catch(err => this.notifyError(err));
            this.notifySuccess('Successfully switched to ' + this.indexedDB);
            this.ready = true;
          });
      }
    }
  }

  /**
   * start actions and storage selection are blocked while the backend is not ready or the sample is being loaded
   */
  get busy(): boolean {
    return !this.ready || this.loadingSample;
  }

  /**
   * inserts the sample scene of the current language unless it exists already and shows its raw data
   */
  openSample(): void {
    this.loadingSample = true;
    this.sampleSceneService.open(fruitSalesSampleOf(sampleLanguageOf(this.localeId)))
      .then(() => {
        (this.router.routeReuseStrategy as AppRouteReuseStrategy).clear();
        return this.router.navigateByUrl(Route.RAWDATA);
      })
      .catch(err => {
        this.loadingSample = false;
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
      this.init().catch(err => this.notifyError(err));
    }
  }

  private initCouchDBConnection(connectionInfo: ConnectionInfo): void {
    this.couchDBService.initConnection(connectionInfo)
      .then(msg => {
        this.dbService.initBackend(true)
          .then(() => this.couchDBConnectionSucceeded(msg))
          .catch(err => this.couchDBConnectionFailed(err));
      })
      .catch(couchDBErr => this.couchDBConnectionFailed(couchDBErr));
  }

  private couchDBConnectionSucceeded(msg: string): void {
    this.ready = true;
    this.notifySuccess(msg);
    this.init().catch(err => this.notifyError(err));
  }

  private couchDBConnectionFailed(error: string | object): void {
    this.ready = false;
    this.notifyError(error);
    if (this.dbService.isIndexedDbInUse()) {
      this.init().catch(err => this.notifyError(err));
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
