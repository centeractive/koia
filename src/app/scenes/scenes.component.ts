import { Component, OnInit } from '@angular/core';
import { SceneInfo, Route, Scene } from 'app/shared/model';
import { Router } from '@angular/router';
import { NotificationService, DialogService } from 'app/shared/services';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { DBService } from 'app/shared/services/backend';
import { AppRouteReuseStrategy } from 'app/app-route-reuse-strategy';
import { Location } from '@angular/common';
import { AbstractComponent } from 'app/shared/component/abstract.component';
import { ConfirmDialogData } from 'app/shared/component/confirm-dialog/confirm-dialog/confirm-dialog.component';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'koia-scenes',
    templateUrl: './scenes.component.html',
    styleUrls: ['./scenes.component.css'],
    standalone: false
})
export class ScenesComponent extends AbstractComponent implements OnInit {

  readonly urlFront = '/' + Route.FRONT;
  readonly urlScene = '/' + Route.SCENE;
  activeScene: Scene;
  filter = '';
  filteredSceneInfos: SceneInfo[] = [];
  columns = ['actions', 'name', 'shortDescription', 'creationTime'];

  private sceneInfos: SceneInfo[] = [];

  constructor(public router: Router, private location: Location, bottomSheet: MatBottomSheet, private dbService: DBService,
    private dialogService: DialogService, notificationService: NotificationService) {
    super(bottomSheet, notificationService);
  }

  ngOnInit() {
    if (!this.dbService.isBackendInitialized()) {
      this.router.navigateByUrl(Route.FRONT);
    } else {
      this.loadData();
    }
  }

  onFilterChange(): void {
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
        (this.router.routeReuseStrategy as AppRouteReuseStrategy).clear();
        this.showRawData();
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

  onDeleteScenesButtonPressed(): void {
    const title = this.filter ? 'Delete filtered scenes' : 'Delete all scenes';
    const text = '<p>Do you really want to delete ' + this.filteredSceneInfos.length + ' scene(s)?</p>';
    const data = new ConfirmDialogData(title, text, ConfirmDialogData.YES_NO);
    const dialogRef = this.dialogService.showConfirmDialog(data);
    firstValueFrom(dialogRef.afterClosed()).then(r => {
      if (data.closedWithButtonIndex === 0) {
        this.deleteScenes(this.filteredSceneInfos);
      }
    });
  }

  private deleteScenes(sceneInfos: SceneInfo[]): void {
    const promises = sceneInfos.map(si => this.dbService.deleteScene(si));
    Promise.all(promises)
      .then(r => {
        const action = sceneInfos.length === 1 ? ' scene has ' : ' scenes have ';
        this.notifySuccess(sceneInfos.length + action + 'been deleted');
        this.loadData();
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

  showRawData() {
    this.router.navigateByUrl(Route.RAWDATA);
  }

  cancel() {
    this.location.back();
  }
}
