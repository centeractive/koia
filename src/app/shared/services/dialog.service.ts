import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ConnectionDialogComponent, ConnectionDialogData } from 'app/front/connection-dialog/connection-dialog.component';
import { SceneDetailsDialogComponent } from 'app/scenes/scene-details-dialog/scene-details-dialog.component';
import { ConfigLauncherContext, ConfigLauncherDialogComponent } from '../component/config-launcher-dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../component/confirm-dialog/confirm-dialog/confirm-dialog.component';
import { InputDialogComponent, InputDialogData } from '../component/input-dialog/input-dialog.component';
import { ManageConfigContext, ManageConfigDialogComponent } from '../component/manage-config-dialog';
import { ManageViewContext, ManageViewDialogComponent } from '../component/manage-view-dialog';
import { ViewLauncherContext, ViewLauncherDialogComponent } from '../component/view-launcher-dialog';
import { Scene } from '../model';

@Injectable({
  providedIn: 'root'
})
export class DialogService {

  constructor(private dialogService: MatDialog) { }

  showConfirmDialog(data: ConfirmDialogData): MatDialogRef<ConfirmDialogComponent> {
    return this.dialogService.open(ConfirmDialogComponent, { data: data, panelClass: 'dialog-container' });
  }

  showInputDialog(data: InputDialogData): MatDialogRef<InputDialogComponent> {
    return this.dialogService.open(InputDialogComponent, { data: data, panelClass: 'dialog-container' });
  }

  showConnectionDialog(data: ConnectionDialogData): MatDialogRef<ConnectionDialogComponent> {
    return this.dialogService.open(ConnectionDialogComponent, { data: data, panelClass: 'dialog-container' });
  }

  showSceneDetailsDialog(scene: Scene): MatDialogRef<SceneDetailsDialogComponent> {
    return this.dialogService.open(SceneDetailsDialogComponent, { data: scene, panelClass: 'dialog-container' });
  }

  showViewLauncherDialog(context: ViewLauncherContext): MatDialogRef<ViewLauncherDialogComponent> {
    return this.dialogService.open(ViewLauncherDialogComponent, { data: context, panelClass: 'dialog-container' });
  }

  showConfigLauncherDialog(context: ConfigLauncherContext): MatDialogRef<ConfigLauncherDialogComponent> {
    return this.dialogService.open(ConfigLauncherDialogComponent, { data: context, panelClass: 'dialog-container' });
  }

  showManageConfigDialog(context: ManageConfigContext): MatDialogRef<ManageConfigDialogComponent> {
    return this.dialogService.open(ManageConfigDialogComponent, { data: context, panelClass: 'dialog-container' });
  }

  showManageViewDialog(context: ManageViewContext): MatDialogRef<ManageViewDialogComponent> {
    return this.dialogService.open(ManageViewDialogComponent, { data: context, panelClass: 'dialog-container' });
  }
}
