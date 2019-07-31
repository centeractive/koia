import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ConnectionInfo } from 'app/shared/services/backend/couchdb';
import { CommonUtils } from 'app/shared/utils';

@Component({
  selector: 'koia-connection-dialog',
  templateUrl: './connection-dialog.component.html'
})
export class ConnectionDialogComponent {

  editingConnInfo: ConnectionInfo;

  constructor(public dialogRef: MatDialogRef<ConnectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public connectionInfo: ConnectionInfo) {
    this.editingConnInfo = <ConnectionInfo>CommonUtils.clone(connectionInfo);
    this.dialogRef.disableClose = true;
  }

  onOK() {
    this.connectionInfo.host = this.editingConnInfo.host;
    this.connectionInfo.port = this.editingConnInfo.port;
    this.connectionInfo.user = this.editingConnInfo.user;
    this.connectionInfo.password = this.editingConnInfo.password;
    this.dialogRef.close();
  }
}
