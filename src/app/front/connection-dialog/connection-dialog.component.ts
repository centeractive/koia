import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonUtils } from 'app/shared/utils';
import { Protocol, ConnectionInfo } from 'app/shared/model';
import { CouchDBConfig } from 'app/shared/services/backend/couchdb/couchdb-config';

@Component({
    selector: 'koia-connection-dialog',
    templateUrl: './connection-dialog.component.html',
    styleUrls: ['./connection-dialog.component.css'],
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
export class ConnectionDialogComponent {

  readonly protocols: Protocol[] = [Protocol.HTTP, Protocol.HTTPS];

  private originalConnInfo: ConnectionInfo;

  constructor(public dialogRef: MatDialogRef<ConnectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConnectionDialogData) {
    this.originalConnInfo = CommonUtils.clone(data.connectionInfo) as ConnectionInfo;
    this.dialogRef.disableClose = true;
  }

  onProtocolChanged(protocol: Protocol): void {
    this.data.connectionInfo.port = CouchDBConfig.defaultPortOf(protocol);
  }

  onCancel(): void {
    this.data.closedWithOK = false;
    this.data.connectionInfo = this.originalConnInfo;
    this.dialogRef.close();
  }

  onOK(): void {
    this.data.closedWithOK = true;
    this.dialogRef.close();
  }
}

export class ConnectionDialogData {

  connectionInfo: ConnectionInfo;
  closedWithOK = false;

  constructor(connectionInfo: ConnectionInfo) {
    this.connectionInfo = CommonUtils.clone(connectionInfo) as ConnectionInfo;
  }
}
