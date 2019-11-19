import { Component, Inject, ViewEncapsulation, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { CommonUtils } from 'app/shared/utils';
import { Protocol, ConnectionInfo } from 'app/shared/model';
import { CouchDBConfig } from 'app/shared/services/backend/couchdb/couchdb-config';

@Component({
  selector: 'koia-connection-dialog',
  templateUrl: './connection-dialog.component.html',
  styleUrls: ['./connection-dialog.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ConnectionDialogComponent implements OnInit {

  readonly protocols: Protocol[] = [Protocol.HTTP, Protocol.HTTPS];

  private originalConnInfo: ConnectionInfo;

  constructor(public dialogRef: MatDialogRef<ConnectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConnectionDialogData) {
    this.originalConnInfo = <ConnectionInfo> CommonUtils.clone(data.connectionInfo);
    this.dialogRef.disableClose = true;
  }

  ngOnInit() {
    console.log('on init')
  }

  onProtocolChanged(protocol: Protocol): void {
    this.data.connectionInfo.port = CouchDBConfig.defaultPortOf(protocol);
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
