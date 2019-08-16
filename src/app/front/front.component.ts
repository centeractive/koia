import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { DialogService, NotificationService } from 'app/shared/services';
import { Route, ConnectionInfo } from 'app/shared/model';
import { DBService } from 'app/shared/services/backend';
import { ReaderService, DataReader } from 'app/shared/services/reader';
import { CouchDBService } from 'app/shared/services/backend/couchdb';
import { MatBottomSheet } from '@angular/material';
import * as $ from 'jquery';
import 'slick-carousel';
import { Router, ActivatedRoute } from '@angular/router';
import { QueryParamExtractor, CommonUtils } from 'app/shared/utils';
import { ConnectionDialogData } from './connection-dialog/connection-dialog.component';
import { AbstractComponent } from 'app/shared/component/abstract.component';

@Component({
  selector: 'koia-front',
  templateUrl: './front.component.html',
  styleUrls: ['./front.component.css']
})
export class FrontComponent extends AbstractComponent implements OnInit, AfterViewInit {

  readonly indexedDB = 'IndexedDB';
  readonly couchDB = 'CouchDB';
  readonly urlScene = '/' + Route.SCENE;
  readonly urlScenes = '/' + Route.SCENES;

  private readonly carouselOptions = {
    slidesToShow: 1, arrows: false, dots: true, infinite: true,
    autoplay: true, autoplaySpeed: 4000, pauseOnFocus: true, fade: true, speed: 2000
  };
  private readonly screenshots = ['scene', 'scenes', 'raw-data', 'raw-data-filtered', 'chart-sidebar', 'chart-sidebar2',
    'grid-view', 'flex-view', 'raw-data-details', 'pivot-table', 'grouping'];

  stepsVisible = true;
  stepVisibleControl: FormGroup;
  showScreenshots = true;
  imagePaths: string[];
  dataStorages = [this.indexedDB, this.couchDB];
  selectedDataStorage: string;
  ready = false;
  scenesCount: number;
  readers: DataReader[];

  constructor(private router: Router, private activatedRoute: ActivatedRoute, bottomSheet: MatBottomSheet, private dbService: DBService,
    private couchDBService: CouchDBService, private readerService: ReaderService, private dialogService: DialogService,
    notificationService: NotificationService, private formBuilder: FormBuilder) {
    super(bottomSheet, notificationService);
  }

  ngOnInit() {
    this.stepVisibleControl = this.formBuilder.group({ firstCtrl: ['', Validators.required] });
    this.imagePaths = this.screenshots.map(s => '../../assets/screenshots/' + s + '.png');
    this.readers = this.readerService.getReaders();

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
  private handleExternalInvocation(queryParamExtractor: QueryParamExtractor) {
    this.couchDBService.initConnection(queryParamExtractor.getCouchDBConnectionInfo())
      .then(msg => this.dbService.initBackend(true)
        .then(r => this.dbService.activateScene(queryParamExtractor.getSceneID())
          .then(scene => this.router.navigateByUrl(Route.RAWDATA)))
        .catch(err => this.notifyError('cannot show raw data of scene with _id ' + queryParamExtractor.getSceneID() + ':\n\n' + err)));
  }

  ngAfterViewInit(): void {
    if (this.showScreenshots) {
      $('.carousel').slick(this.carouselOptions);
    }
  }

  onDataStorageChanged(): void {
    if (this.selectedDataStorage === this.couchDB) {
      this.showCouchDBConnectionDialog();
    } else {
      this.dbService.useBrowserStorage()
        .then(r => {
          this.init();
          this.notifySuccess('Successfully switched to ' + this.indexedDB);
          this.ready = true;
        });
    }
  }

  showCouchDBConnectionDialog(): void {
    const data = new ConnectionDialogData(this.couchDBService.getConnectionInfo());
    const dialogRef = this.dialogService.showConnectionDialog(data);
    dialogRef.afterClosed().toPromise().then(r => this.onCouchDBConnectionDialogClosed(data));
  }

  private onCouchDBConnectionDialogClosed(data: ConnectionDialogData): void {
    if (data.closedWithOK) {
      if (this.dbService.usesBrowserStorage() || !CommonUtils.compare(data.connectionInfo, this.couchDBService.getConnectionInfo())) {
        this.ready = false;
        this.initCouchDBConnection(data.connectionInfo);
      }
    } else if (this.dbService.usesBrowserStorage()) {
      this.init();
    }
  }

  private initCouchDBConnection(connectionInfo: ConnectionInfo): void {
    this.couchDBService.initConnection(connectionInfo)
      .then(msg => {
        this.dbService.initBackend(true)
          .then(r => this.couchDBConnectionSucceeded(msg))
          .catch(err => this.couchDBConnectionFailed(err));
      })
      .catch(couchDBErr => this.couchDBConnectionFailed(couchDBErr));
  }

  private couchDBConnectionSucceeded(msg: string): void {
    this.notifySuccess(msg);
    this.init();
  }

  private couchDBConnectionFailed(error: string | Object): void {
    this.notifyError(error);
  }

  private init(): void {
    this.selectedDataStorage = this.dbService.usesBrowserStorage() ? this.indexedDB : this.couchDB;
    this.dbService.findSceneInfos()
      .then(sceneInfos => {
        this.scenesCount = sceneInfos.length;
        this.ready = true;
      })
      .catch(err => this.notifyError(err));
  }
}
