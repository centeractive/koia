import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { SceneDetailsDialogComponent } from 'app/scenes/scene-details-dialog.component';
import { Scene } from '../model';
import { ConnectionDialogComponent, ConnectionDialogData } from 'app/front/connection-dialog/connection-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class DialogService {

  constructor(private dialogService: MatDialog) { }

  showConnectionDialog(data: ConnectionDialogData): MatDialogRef<ConnectionDialogComponent> {
    return this.dialogService.open(ConnectionDialogComponent, { data: data, panelClass: 'dialog-container' });
  }

  showSceneDetailsDialog(scene: Scene): MatDialogRef<SceneDetailsDialogComponent> {
      return this.dialogService.open(SceneDetailsDialogComponent, { data: scene, panelClass: 'dialog-container' });
  }
}
