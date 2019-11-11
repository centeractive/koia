import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { SceneDetailsDialogComponent } from 'app/scenes/scene-details-dialog.component';
import { Scene } from '../model';
import { ConnectionDialogComponent, ConnectionDialogData } from 'app/front/connection-dialog/connection-dialog.component';
import { InputDialogComponent, InputDialogData } from '../component/input-dialog/input-dialog.component';
import { ConfirmDialogData, ConfirmDialogComponent } from '../component/confirm-dialog/confirm-dialog/confirm-dialog.component';
import { ViewLauncherDialogComponent, ViewLauncherContext } from '../component/view-launcher-dialog';

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
}
