import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ViewLauncherContext } from './view-launcher-context.type.';

@Component({
  selector: 'koia-view-launcher-dialog',
  templateUrl: './view-launcher-dialog.component.html',
  styleUrls: ['./view-launcher-dialog.component.css']
})
export class ViewLauncherDialogComponent {

  title: string;

  constructor(public dialogRef: MatDialogRef<ViewLauncherDialogComponent>, @Inject(MAT_DIALOG_DATA) public context: ViewLauncherContext) {
    this.dialogRef.disableClose = true;
    this.title = 'Create View';
  }
}
