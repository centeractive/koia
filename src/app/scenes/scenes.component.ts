import { Component, OnInit } from '@angular/core';
import { SceneInfo, Route } from 'app/shared/model';
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

  readonly urlScene = '/' + Route.SCENE;
  activeSceneId: string;
  sceneInfos: SceneInfo[];

  constructor(public router: Router, bottomSheet: MatBottomSheet, private dbService: DBService, private dialogService: DialogService,
    notificationService: NotificationService) {
    super(bottomSheet, notificationService);
  }

  ngOnInit() {
    if (!this.dbService.isBackendInitialized()) {
      this.router.navigateByUrl(Route.FRONT);
    } else {
      this.activeSceneId = this.findActiveSceneId();
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

  private findActiveSceneId() {
    const activeScene = this.dbService.getActiveScene();
    return activeScene ? activeScene._id : undefined;
  }

  showSceneDetails(sceneID: string): void {
    this.dbService.findScene(sceneID)
      .then(s => this.dialogService.showSceneDetailsDialog(s));
  }

  activate(sceneInfo: SceneInfo) {
    this.dbService.activateScene(sceneInfo._id)
      .then(s => {
        (<AppRouteReuseStrategy>this.router.routeReuseStrategy).clear();
        this.router.navigateByUrl(Route.RAWDATA);
      })
      .catch(err => this.notifyError(err));
  }

  delete(sceneInfo: SceneInfo) {
    this.dbService.deleteScene(sceneInfo)
      .then(s => {
        ArrayUtils.removeElement(this.sceneInfos, sceneInfo);
        this.notifySuccess('Scene has been deleted');
      })
      .catch(err => this.notifyError(err));
  }

  leave() {
    this.router.navigateByUrl(Route.RAWDATA);
  }
}
