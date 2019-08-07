import { Component, OnInit } from '@angular/core';
import { SceneInfo, Route, Scene } from 'app/shared/model';
import { Router } from '@angular/router';
import { NotificationService, DialogService } from 'app/shared/services';
import { MatBottomSheet } from '@angular/material';
import { DBService } from 'app/shared/services/backend';
import { AppRouteReuseStrategy } from 'app/app-route-reuse-strategy';
import { ArrayUtils } from 'app/shared/utils';
import { AbstractComponent } from 'app/shared/controller';

@Component({
  selector: 'koia-scenes',
  templateUrl: './scenes.component.html',
  styleUrls: ['./scenes.component.css']
})
export class ScenesComponent extends AbstractComponent implements OnInit {

  readonly route = Route.SCENES;
  readonly urlFront = '/' + Route.FRONT;
  readonly urlScene = '/' + Route.SCENE;
  activeScene: Scene;
  sceneInfos: SceneInfo[];
  filter: string;

  constructor(public router: Router, bottomSheet: MatBottomSheet, private dbService: DBService, private dialogService: DialogService,
    notificationService: NotificationService) {
    super(bottomSheet, notificationService);
  }

  ngOnInit() {
    if (!this.dbService.isBackendInitialized()) {
      this.router.navigateByUrl(Route.FRONT);
    } else {
      this.activeScene = this.dbService.getActiveScene();
      this.dbService.findSceneInfos()
        .then(sceneInfos => {
          if (sceneInfos && sceneInfos.length > 0) {
            this.sceneInfos = sceneInfos;
          } else {
            this.router.navigateByUrl(Route.SCENE);
          }
        });
    }
  }

  filteredSceneInfos(): SceneInfo[] {
    if (this.filter && this.sceneInfos) {
      const lowerCaseFilter = this.filter.toLocaleLowerCase();
      return this.sceneInfos
        .filter(si => si.name.toLocaleLowerCase().includes(lowerCaseFilter) ||
          si.shortDescription.toLocaleLowerCase().includes(lowerCaseFilter));
    }
    return this.sceneInfos;
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
        this.activeScene = undefined;
        ArrayUtils.removeElement(this.sceneInfos, sceneInfo);
        this.notifySuccess('Scene has been deleted');
      })
      .catch(err => this.notifyError(err));
  }

  leave() {
    this.router.navigateByUrl(Route.RAWDATA);
  }
}
