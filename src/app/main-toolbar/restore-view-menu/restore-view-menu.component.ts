import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Router } from '@angular/router';
import { AbstractComponent } from 'app/shared/component/abstract.component';
import { SavedView } from 'app/shared/model/view-config';
import { SceneFileOpener } from 'app/shared/scene-file/scene-file-opener';
import { SceneFileService } from 'app/shared/scene-file/scene-file.service';
import { NotificationService } from 'app/shared/services';
import { SavedViewsService } from 'app/shared/services/saved-views';

@Component({
  selector: 'koia-restore-view-menu',
  templateUrl: './restore-view-menu.component.html',
  styleUrls: ['../toolbar-menu-host.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class RestoreViewMenuComponent extends AbstractComponent implements OnDestroy {

  readonly sceneFileOpener: SceneFileOpener;

  constructor(private savedViewsService: SavedViewsService, sceneFileService: SceneFileService, router: Router, bottomSheet: MatBottomSheet,
    notificationService: NotificationService) {
    super(bottomSheet, notificationService);
    this.sceneFileOpener = new SceneFileOpener(sceneFileService, router, this);
  }

  get ready(): boolean {
    return this.savedViewsService.ready;
  }

  get savedViews(): SavedView[] {
    return this.savedViewsService.findAll();
  }

  get icon(): string {
    return this.sceneFileOpener.importing ? this.sceneFileOpener.icon : 'open_in_browser';
  }

  get tooltipKey(): string {
    return this.sceneFileOpener.importing ? this.sceneFileOpener.tooltipKey : 'view.restoreMenu';
  }

  cancelImport(): void {
    if (this.sceneFileOpener.cancelable) {
      this.sceneFileOpener.cancel();
    }
  }

  restore(view: SavedView): void {
    this.savedViewsService.restore(view);
  }

  manage(): void {
    this.savedViewsService.manage(status => this.showStatus(status));
  }

  ngOnDestroy(): void {
    this.sceneFileOpener.destroy();
  }
}
