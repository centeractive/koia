import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { VIEW_NAME_MAX_LENGTH } from 'app/shared/controller';
import { View } from 'app/shared/model/view-config';
import { ManageViewContext } from './manage-view-context.type';

@Component({
  selector: 'koia-manageView-dialog',
  templateUrl: './manage-view-dialog.component.html',
  styleUrls: ['./manage-view-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class ManageViewDialogComponent<T extends { name: string, modifiedTime: number } = View> {

  readonly viewNameMaxLength = VIEW_NAME_MAX_LENGTH;

  items: ViewItem<T>[];
  changed = false;
  valid = true;

  constructor(public dialogRef: MatDialogRef<ManageViewDialogComponent<T>>, @Inject(MAT_DIALOG_DATA) public context: ManageViewContext<T>) {
    this.dialogRef.disableClose = true;
    this.items = context.views
      .map(view => ({ view, name: view.name, deleted: false }));
  }

  deleteItem(item: ViewItem<T>): void {
    item.deleted = true;
    this.onChange();
  }

  onChange(): void {
    const retainedNames = this.items
      .filter(item => !item.deleted)
      .map(item => item.name.trim());
    this.changed = this.items.some(item => item.deleted) || this.renamedItems().length > 0;
    this.valid = retainedNames.every(name => name) && new Set(retainedNames).size === retainedNames.length;
  }

  butOkPressed(): void {
    const deletedViews = this.items
      .filter(item => item.deleted)
      .map(item => item.view);
    const renamedItems = this.renamedItems();
    renamedItems.forEach(item => { item.view.name = item.name.trim(); });
    this.context.updateViews(deletedViews, renamedItems.map(item => item.view));
    this.dialogRef.close();
  }

  private renamedItems(): ViewItem<T>[] {
    return this.items
      .filter(item => !item.deleted)
      .filter(item => item.name.trim() !== item.view.name);
  }
}

interface ViewItem<T> {
  view: T;
  name: string;
  deleted: boolean;
}
