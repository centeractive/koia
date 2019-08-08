import { Component, OnInit } from '@angular/core';
import { SceneInfo, Route, Scene } from 'app/shared/model';
import { Router } from '@angular/router';
import { NotificationService, DialogService } from 'app/shared/services';
import { MatBottomSheet } from '@angular/material';
import { DBService } from 'app/shared/services/backend';
import { AppRouteReuseStrategy } from 'app/app-route-reuse-strategy';
import { AbstractComponent } from 'app/shared/controller';

@Component({
  selector: 'koia-scenes',
  templateUrl: './scenes.component.html',
  styleUrls: ['./scenes.component.css']
})
export class ScenesComponent extends AbstractComponent implements OnInit {

  readonly urlFront = '/' + Route.FRONT;
  readonly urlScene = '/' + Route.SCENE;
  activeScene: Scene;
  filter = '';
  filteredSceneInfos: SceneInfo[] = [];

  private sceneInfos: SceneInfo[] = [];

  constructor(public router: Router, bottomSheet: MatBottomSheet, private dbService: DBService, private dialogService: DialogService,
    notificationService: NotificationService) {
    super(bottomSheet, notificationService);
  }

  ngOnInit() {
    if (!this.dbService.isBackendInitialized()) {
      this.router.navigateByUrl(Route.FRONT);
    } else {
      this.loadData();
    }
  }

  onFilterChange(filter: string): void {
    this.filter = filter;
    this.filteredSceneInfos = this.filterSceneInfos();
  }

  showSceneDetails(sceneID: string): void {
    this.dbService.findScene(sceneID)
      .then(s => this.dialogService.showSceneDetailsDialog(s));
  }

  activate(sceneInfo: SceneInfo) {
    this.dbService.activateScene(sceneInfo._id)
      .then(s => {
        this.activeScene = s;
        (<AppRouteReuseStrategy>this.router.routeReuseStrategy).clear();
        this.router.navigateByUrl(Route.RAWDATA);
      })
      .catch(err => this.notifyError(err));
  }

  delete(sceneInfo: SceneInfo) {
    this.dbService.deleteScene(sceneInfo)
      .then(s => {
        this.loadData();
        this.notifySuccess('Scene has been deleted');
      })
      .catch(err => {
        this.loadData();
        this.notifyError(err);
      });
  }

  deleteFilteredScenes() {
    const scenesCount = this.filteredSceneInfos.length;
    const promises = this.filteredSceneInfos.map(si => this.dbService.deleteScene(si));
    Promise.all(promises)
      .then(r => {
        this.loadData();
        this.notifySuccess(scenesCount + ' scenes have been deleted');
      })
      .catch(err => {
        this.loadData();
        this.notifyError(err);
      });
  }

  private loadData(): void {
    this.activeScene = this.dbService.getActiveScene();
    this.dbService.findSceneInfos()
      .then(sceneInfos => {
        if (sceneInfos && sceneInfos.length > 0) {
          this.sceneInfos = sceneInfos;
          this.filteredSceneInfos = this.filterSceneInfos();
        } else {
          this.router.navigateByUrl(Route.SCENE);
        }
      });
  }

  private filterSceneInfos(): SceneInfo[] {
    if (this.filter && this.sceneInfos) {
      const lowerCaseFilter = this.filter.toLowerCase();
      return this.sceneInfos
        .filter(si => si.name.toLowerCase().includes(lowerCaseFilter) ||
          si.shortDescription.toLowerCase().includes(lowerCaseFilter));
    }
    return this.sceneInfos;
  }

  leave() {
    this.router.navigateByUrl(Route.RAWDATA);
  }
}
