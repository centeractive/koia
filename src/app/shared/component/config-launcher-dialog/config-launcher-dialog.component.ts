import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfigLauncherContext } from './config-launcher-context.type.';

@Component({
  selector: 'koia-config-launcher-dialog',
  templateUrl: './config-launcher-dialog.component.html',
  styleUrls: ['./config-launcher-dialog.component.css']
})
export class ConfigLauncherDialogComponent {

  constructor(public dialogRef: MatDialogRef<ConfigLauncherDialogComponent>, @Inject(MAT_DIALOG_DATA) public context: ConfigLauncherContext) {
    this.dialogRef.disableClose = true;
  }
}
