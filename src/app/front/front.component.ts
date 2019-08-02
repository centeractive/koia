import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { DialogService, NotificationService } from 'app/shared/services';
import { Route } from 'app/shared/model';
import { DBService } from 'app/shared/services/backend';
import { ReaderService, DataReader } from 'app/shared/services/reader';
import { CouchDBService, ConnectionInfo } from 'app/shared/services/backend/couchdb';
import { MatBottomSheet } from '@angular/material';
import { AbstractComponent } from 'app/shared/controller';
import * as $ from 'jquery';
import 'slick-carousel';
import { Router, ActivatedRoute, Params, ParamMap } from '@angular/router';
import { NumberUtils } from 'app/shared/utils';

@Component({
  selector: 'koia-front',
  templateUrl: './front.component.html',
  styleUrls: ['./front.component.css']
})
export class FrontComponent extends AbstractComponent implements OnInit, AfterViewInit {

  readonly browser = 'Browser';
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
  dataStorages = [this.browser, this.couchDB];
  selectedDataStorage: string;
  sceneCount: number;
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
    this.dbService.initBackend(false)
      .then(() => this.init())
      .catch(err => this.notifyError(err));
  }

  ngAfterViewInit(): void {
    if (this.showScreenshots) {
      $('.carousel').slick(this.carouselOptions);
    }
  }

  onDataStorageChanged(): void {
    if (this.selectedDataStorage === this.couchDB) {
      this.shownCouchDBConnectionDialog();
    } else {
      this.dbService.useBrowserStorage()
        .then(r => {
          this.init();
          this.notifySuccess('Successfully switched to ' + this.browser + ' datastore');
        });
    }
  }

  shownCouchDBConnectionDialog(): void {
    const connectionInfo = this.couchDBService.getConnectionInfo();
    const dialogRef = this.dialogService.showConnectionDialog(connectionInfo);
    dialogRef.afterClosed().toPromise().then(r => this.onCouchDBConnectionDialogClosed(connectionInfo));
  }

  private onCouchDBConnectionDialogClosed(connectionInfo: ConnectionInfo): void {
    if (this.dbService.usesBrowserStorage() ||
      JSON.stringify(connectionInfo) !== JSON.stringify(this.couchDBService.getConnectionInfo())) {
      this.initCouchDBConnection(connectionInfo);
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
    this.init();
  }

  private init(): void {
    this.selectedDataStorage = this.dbService.usesBrowserStorage() ? this.browser : this.couchDB;
    this.dbService.findSceneInfos()
      .then(sceneInfos => this.sceneCount = sceneInfos.length);
  }
}
