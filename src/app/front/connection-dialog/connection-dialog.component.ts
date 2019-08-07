import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ConnectionInfo } from 'app/shared/services/backend/couchdb';
import { CommonUtils } from 'app/shared/utils';
import { Protocol } from 'app/shared/model';

@Component({
  selector: 'koia-connection-dialog',
  templateUrl: './connection-dialog.component.html'
})
export class ConnectionDialogComponent {

  readonly protocols: Protocol[] = [Protocol.HTTP, Protocol.HTTPS];

  private originalConnInfo: ConnectionInfo;

  constructor(public dialogRef: MatDialogRef<ConnectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConnectionDialogData) {
    this.originalConnInfo = <ConnectionInfo> CommonUtils.clone(data.connectionInfo);
    this.dialogRef.disableClose = true;
  }

  onCancel() {
    this.data.closedWithOK = false;
    this.data.connectionInfo = this.originalConnInfo;
    this.dialogRef.close();
  }

  onOK() {
    this.data.closedWithOK = true;
    this.dialogRef.close();
  }
}

export class ConnectionDialogData {

  connectionInfo: ConnectionInfo;
  closedWithOK = false;

  constructor(connectionInfo: ConnectionInfo) {
    this.connectionInfo = <ConnectionInfo> CommonUtils.clone(connectionInfo);
  }
}
