import { LanguageService } from 'app/shared/services/language';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { SceneInfo, SceneLabels, Route, Scene } from 'app/shared/model';
import { Router } from '@angular/router';
import { NotificationService, DialogService } from 'app/shared/services';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { DBService } from 'app/shared/services/backend';
import { AppRouteReuseStrategy } from 'app/app-route-reuse-strategy';
import { Location } from '@angular/common';
import { AbstractComponent } from 'app/shared/component/abstract.component';
import { ConfirmDialogData } from 'app/shared/component/confirm-dialog/confirm-dialog/confirm-dialog.component';
import { firstValueFrom } from 'rxjs';
import { orderSceneInfos } from './scene-order';

@Component({
  selector: 'koia-scenes',
  templateUrl: './scenes.component.html',
  styleUrls: ['./scenes.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class ScenesComponent extends AbstractComponent implements OnInit {

  readonly route = Route.SCENES;
  activeScene: Scene;
  filter = '';
  filteredSceneInfos: SceneInfo[] = [];
  sceneNames = new Set<string>();
  editing = false;

  private sceneInfos: SceneInfo[] = [];

  constructor(private router: Router, private location: Location, bottomSheet: MatBottomSheet, private dbService: DBService,
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

  activate(sceneInfo: SceneInfo) {
    this.dbService.activateScene(sceneInfo._id)
      .then(s => {
        this.activeScene = s;
        (this.router.routeReuseStrategy as AppRouteReuseStrategy).clear();
        this.showRawData();
      })
      .catch(err => this.notifyError(err));
  }

  updateLabels(labels: SceneLabels): void {
    this.reloadAfter(this.dbService.updateSceneLabels(labels), LanguageService.instant('scenes.sceneUpdated'));
  }

  delete(sceneInfo: SceneInfo) {
    this.reloadAfter(this.dbService.deleteScene(sceneInfo), LanguageService.instant('scenes.sceneDeleted'));
  }

  onDeleteScenesButtonPressed(): void {
    const title = LanguageService.instant(this.filter ? 'scenes.deleteFilteredTitle' : 'scenes.deleteAllTitle');
    const text = '<p>' + LanguageService.instant('scenes.deleteConfirm', { count: this.filteredSceneInfos.length }) + '</p>';
    const data = new ConfirmDialogData(title, text, ConfirmDialogData.YES_NO);
    const dialogRef = this.dialogService.showConfirmDialog(data);
    firstValueFrom(dialogRef.afterClosed()).then(() => {
      if (data.closedWithButtonIndex === 0) {
        this.deleteScenes(this.filteredSceneInfos);
      }
    });
  }

  private deleteScenes(sceneInfos: SceneInfo[]): void {
    this.reloadAfter(Promise.all(sceneInfos.map(si => this.dbService.deleteScene(si))),
      LanguageService.instant(sceneInfos.length === 1 ? 'scenes.scenesDeletedOne' : 'scenes.scenesDeleted', { count: sceneInfos.length }));
  }

  private reloadAfter(change: Promise<unknown>, successMessage: string): void {
    change
      .then(() => {
        this.loadData();
        this.notifySuccess(successMessage);
      })
      .catch(err => {
        this.loadData();
        this.notifyError(err);
      });
  }

  private loadData(): void {
    this.activeScene = this.dbService.getActiveScene();
    Promise.all([this.dbService.findSceneInfos(), this.dbService.findSceneActivationTimes()])
      .then(([sceneInfos, activationTimes]) => {
        if (sceneInfos && sceneInfos.length > 0) {
          this.sceneInfos = orderSceneInfos(sceneInfos, activationTimes, this.activeScene?._id);
          this.sceneNames = new Set(sceneInfos.map(si => si.name));
          this.filteredSceneInfos = this.filterSceneInfos();
        } else {
          this.router.navigateByUrl(Route.SCENE);
        }
      })
      .catch(err => this.notifyError(err));
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
