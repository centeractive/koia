import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ViewLauncherContext } from './view-launcher-context.type.';
import { View } from 'app/shared/model/view-config';

@Component({
  selector: 'koia-view-launcher-dialog',
  templateUrl: './view-launcher-dialog.component.html',
  styleUrls: ['./view-launcher-dialog.component.css']
})
export class ViewLauncherDialogComponent {

  views: View[];

  constructor(public dialogRef: MatDialogRef<ViewLauncherDialogComponent>, @Inject(MAT_DIALOG_DATA) public context: ViewLauncherContext) {
    this.dialogRef.disableClose = true;
    this.views = context.findViews();
  }
}
