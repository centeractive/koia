import { Injectable } from '@angular/core';
import { MatBottomSheet } from '@angular/material';
import { Status, StatusType } from '../model';
import { StatusComponent } from 'app/status/status.component';

@Injectable()
export class NotificationService {

  onSuccess(bottomSheet: MatBottomSheet, message: string | Object): void {
    this.showStatus(bottomSheet, this.createStatus(StatusType.SUCCESS, message));
  }

  onWarning(bottomSheet: MatBottomSheet, warning: string | Object): void {
    this.showStatus(bottomSheet, this.createStatus(StatusType.WARNING, warning));
  }

  onError(bottomSheet: MatBottomSheet, error: string | Object): void {
    this.showStatus(bottomSheet, this.createStatus(StatusType.ERROR, error));
  }

  showStatus(bottomSheet: MatBottomSheet, status: Status): void {
    bottomSheet.open(StatusComponent, { data: { status }, panelClass: status.type });
  }

  private createStatus(statusType: StatusType, value: string | Object): Status {
    return { type: statusType, msg: this.toMessage(value) };
  }

  private toMessage(value: string | Object): string {
    if (typeof value === 'string') {
      return <string> value;
    } else if (value instanceof Error) {
      const error = <Error> value;
      return error.name + ': ' + error.message;
    }
    return JSON.stringify(value);
  }
}
