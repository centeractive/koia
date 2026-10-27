import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { SceneUtils } from 'app/scene/utils';
import { Scene, SceneInfo, SceneLabels } from 'app/shared/model';
import { DialogService, NotificationService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { AbstractComponent } from 'app/shared/component/abstract.component';
import { ConditionalErrorStateMatcher } from 'app/shared/validator/conditional-error-state-matcher';
import { SceneEdit } from './scene-edit';

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
  @Input() existingSceneNames = new Set<string>();
  @Input() locked = false;

  @Output() onActivate = new EventEmitter<SceneInfo>();
  @Output() onContinue = new EventEmitter<SceneInfo>();
  @Output() onShare = new EventEmitter<SceneInfo>();
  @Output() onDelete = new EventEmitter<SceneInfo>();
  @Output() onEdit = new EventEmitter<SceneLabels>();
  @Output() editingChange = new EventEmitter<boolean>();

  readonly sceneNameMaxLength = SceneUtils.SCENE_NAME_MAX_LENGTH;
  readonly sceneNameErrorStateMatcher = new ConditionalErrorStateMatcher(() => this.edit.isNameTaken() || this.edit.isNameTooLong());

  columns = ['actions', 'name', 'shortDescription', 'creationTime'];
  edit: SceneEdit;

  constructor(bottomSheet: MatBottomSheet, private dbService: DBService, private dialogService: DialogService,
    notificationService: NotificationService) {
    super(bottomSheet, notificationService);
  }

  isActive(sceneInfo: SceneInfo): boolean {
    return !!this.activeScene && sceneInfo._id === this.activeScene._id;
  }

  showSceneDetails(sceneID: string): void {
    this.dbService.findScene(sceneID)
      .then(s => this.dialogService.showSceneDetailsDialog(s, true))
      .catch(err => this.notifyError(err));
  }

  startEdit(sceneInfo: SceneInfo): void {
    this.setEdit(new SceneEdit(sceneInfo, this.existingSceneNames));
  }

  isEdited(sceneInfo: SceneInfo): boolean {
    return this.edit?.sceneInfo._id === sceneInfo._id;
  }

  saveEdit(): void {
    if (this.edit.isSavable()) {
      this.onEdit.emit(this.edit.toLabels());
      this.setEdit(undefined);
    }
  }

  cancelEdit(): void {
    this.setEdit(undefined);
  }

  private setEdit(edit: SceneEdit | undefined): void {
    this.edit = edit;
    this.editingChange.emit(!!edit);
  }
}
