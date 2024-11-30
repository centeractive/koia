import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfigRecord } from 'app/shared/model/view-config';
import * as _ from 'lodash';
import { ManageConfigContext } from './manage-config-context.type.';

@Component({
    selector: 'koia-manage-config-dialog',
    templateUrl: './manage-config-dialog.component.html',
    styleUrls: ['./manage-config-dialog.component.css'],
    standalone: false
})
export class ManageConfigDialogComponent {

  items: ConfigRecordItem[];
  changed: boolean;

  private clonedRecords: ConfigRecord[];
  private deletedRecords: ConfigRecord[] = [];
  private renamedRecords: ConfigRecord[] = [];

  constructor(public dialogRef: MatDialogRef<ManageConfigDialogComponent>, @Inject(MAT_DIALOG_DATA) public context: ManageConfigContext) {
    this.dialogRef.disableClose = true;
    this.clonedRecords = _.cloneDeep(context.configRecords);
    this.items = context.configRecords
      .map(configRecord => ({ configRecord }));
  }

  deleteItem(item: ConfigRecordItem): void {
    item.deleted = true;
    this.deletedRecords = this.items
      .filter(item => item.deleted)
      .map(item => item.configRecord);
    this.onChange();
  }

  onChange(): void {
    this.renamedRecords = this.items
      .filter((item, i) => item.configRecord.name !== this.clonedRecords[i].name)
      .filter(item => !item.deleted)
      .map(item => item.configRecord);
    this.changed = !!this.deletedRecords.length || !!this.renamedRecords.length;
  }

  butOkPressed(): void {
    this.context.updateConfigRecords(this.deletedRecords, this.renamedRecords);
    this.dialogRef.close();
  }
}

interface ConfigRecordItem {
  configRecord: ConfigRecord;
  deleted?: boolean;
}
