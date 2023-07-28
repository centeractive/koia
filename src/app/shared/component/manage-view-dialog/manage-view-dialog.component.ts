import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { View } from 'app/shared/model/view-config';
import * as _ from 'lodash';
import { ManageViewContext } from './manage-view-context.type.';

@Component({
  selector: 'koia-manageView-dialog',
  templateUrl: './manage-view-dialog.component.html',
  styleUrls: ['./manage-view-dialog.component.css']
})
export class ManageViewDialogComponent {

  items: ViewItem[] = [];
  changed: boolean;

  private clonedViews: View[] = [];
  private deletedViews: View[] = [];
  private renamedViews: View[] = [];

  constructor(public dialogRef: MatDialogRef<ManageViewDialogComponent>, @Inject(MAT_DIALOG_DATA) public context: ManageViewContext) {
    this.dialogRef.disableClose = true;
    if (context.views) {
      this.clonedViews = _.cloneDeep(context.views);
      this.items = context.views.map(view => ({ view })) || [];
    }
  }

  deleteItem(item: ViewItem): void {
    item.deleted = true;
    this.deletedViews = this.items
      .filter(item => item.deleted)
      .map(item => item.view);
    this.onChange();
  }

  onChange(): void {
    this.renamedViews = this.items
      .filter((item, i) => item.view.name !== this.clonedViews[i].name)
      .filter(item => !item.deleted)
      .map(item => item.view);
    this.changed = !!this.deletedViews.length || !!this.renamedViews.length;
  }

  butOkPressed(): void {
    this.context.updateViews(this.deletedViews, this.renamedViews);
    this.dialogRef.close();
  }
}

interface ViewItem {
  view: View;
  deleted?: boolean;
}
