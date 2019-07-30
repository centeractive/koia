import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { DialogService, NotificationService } from 'app/shared/services';
import { Route } from 'app/shared/model';
import { DBService } from 'app/shared/services/backend';
import { ReaderService, DataReader } from 'app/shared/services/reader';
import { CouchDBService, ConnectionInfo } from 'app/shared/services/backend/couchdb';
import { MatBottomSheet, MatHorizontalStepper } from '@angular/material';
import { AbstractComponent } from 'app/shared/controller';
import * as $ from 'jquery';
import 'slick-carousel';

@Component({
  selector: 'koia-front',
  templateUrl: './front.component.html',
  styleUrls: ['./front.component.css']
})
export class FrontComponent extends AbstractComponent implements OnInit, AfterViewInit {

  @ViewChild(MatHorizontalStepper, undefined) stepper: MatHorizontalStepper;

  readonly urlScene = '/' + Route.SCENE;
  readonly urlScenes = '/' + Route.SCENES;
  readonly screenshots = ['scene', 'scenes', 'raw-data', 'raw-data-filtered', 'chart-sidebar', 'chart-sidebar2',
    'grid-view', 'flex-view', 'raw-data-details', 'pivot-table', 'grouping'];

  showScreenshots = true;
  imagePaths: string[];
  browser = 'Browser';
  couchDB = 'CouchDB';
  dataStorages = [this.browser, this.couchDB];
  selectedDataStorage: string;
  sceneCount: number;
  readers: DataReader[];

  constructor(bottomSheet: MatBottomSheet, private dbService: DBService,
    private couchDBService: CouchDBService, private readerService: ReaderService, private dialogService: DialogService,
    notificationService: NotificationService) {
    super(bottomSheet, notificationService);
  }

  ngOnInit() {
    this.imagePaths = this.screenshots.map(s => '../../assets/screenshots/' + s + '.png');
    this.dbService.initBackend(false)
      .then(() => {
        this.init();
        this.readers = this.readerService.getReaders();
      })
      .catch(err => this.notifyError(err));
  }

  ngAfterViewInit(): void {
    this.stepper.selectedIndex = 6;
    this.stepper._steps.first.reset();
    if (this.showScreenshots) {
      $('.carousel').slick({
        slidesToShow: 1,
        arrows: false,
        dots: true,
        infinite: true,
        autoplay: true,
        autoplaySpeed: 4000,
        pauseOnFocus: true,
        fade: true,
        speed: 2000
      });
    }
  }

  onDataStorageChanged() {
    if (this.selectedDataStorage === this.couchDB) {
      this.showDataStoreDefinition();
    } else {
      this.dbService.useBrowserStorage()
        .then(r => {
          this.init();
          this.notifySuccess('Successfully switched to ' + this.browser + ' datastore');
        });
    }
  }

  showDataStoreDefinition(): void {
    const connectionInfo = this.couchDBService.getConnectionInfo();
    const dialogRef = this.dialogService.showCouchDBConfigDialog(connectionInfo);
    dialogRef.afterClosed().toPromise().then(r => {
      if (connectionInfo !== this.couchDBService.getConnectionInfo()) {
        this.onCouchDBConnectionChanged(connectionInfo);
      }
    });
  }

  private onCouchDBConnectionChanged(connectionInfo: ConnectionInfo): void {
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

  private couchDBConnectionFailed(err: string): void {
    this.notifyError(err);
    this.init();
  }

  private init(): void {
    this.selectedDataStorage = this.dbService.usesBrowserStorage() ? this.browser : this.couchDB;
    this.dbService.findSceneInfos()
      .then(sceneInfos => this.sceneCount = sceneInfos.length);
  }
}
