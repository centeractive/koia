import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { AbstractComponent } from 'app/shared/component/abstract.component';
import { SceneFileService } from 'app/shared/scene-file/scene-file.service';
import { NotificationService } from 'app/shared/services';
import { SavedViewsService } from 'app/shared/services/saved-views';

@Component({
  selector: 'koia-save-view-menu',
  templateUrl: './save-view-menu.component.html',
  styleUrls: ['../toolbar-menu-host.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class SaveViewMenuComponent extends AbstractComponent {

  @Input() sceneId: string;
  @Input() activeTabId: string;

  constructor(private savedViewsService: SavedViewsService, private sceneFileService: SceneFileService, bottomSheet: MatBottomSheet,
    notificationService: NotificationService) {
    super(bottomSheet, notificationService);
  }

  get ready(): boolean {
    return this.savedViewsService.ready;
  }

  /**
   * downloads the active scene with its open tabs and all its rows as .koia file
   */
  shareScene(): void {
    this.sceneFileService.export(this.sceneId).catch(err => this.notifyError(err));
  }

  saveView(): void {
    this.savedViewsService.save(this.activeTabId).then(status => {
      if (status) {
        this.showStatus(status);
      }
    });
  }
}
