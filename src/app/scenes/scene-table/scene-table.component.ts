import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { Scene, SceneInfo } from 'app/shared/model';
import { DialogService, NotificationService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { AbstractComponent } from 'app/shared/component/abstract.component';

@Component({
    selector: 'koia-scene-table',
    templateUrl: './scene-table.component.html',
    styleUrls: ['./scene-table.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SceneTableComponent extends AbstractComponent {

  @Input() sceneInfos: SceneInfo[] = [];
  @Input() activeScene: Scene;

  @Output() onActivate = new EventEmitter<SceneInfo>();
  @Output() onContinue = new EventEmitter<SceneInfo>();
  @Output() onDelete = new EventEmitter<SceneInfo>();

  columns = ['actions', 'name', 'shortDescription', 'creationTime'];

  constructor(bottomSheet: MatBottomSheet, private dbService: DBService, private dialogService: DialogService,
    notificationService: NotificationService) {
    super(bottomSheet, notificationService);
  }

  isActive(sceneInfo: SceneInfo): boolean {
    return !!this.activeScene && sceneInfo._id === this.activeScene._id;
  }

  showSceneDetails(sceneID: string): void {
    this.dbService.findScene(sceneID)
      .then(s => this.dialogService.showSceneDetailsDialog(s))
      .catch(err => this.notifyError(err));
  }
}
