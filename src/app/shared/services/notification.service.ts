import { Injectable } from '@angular/core';
import { MatBottomSheet, MatBottomSheetConfig } from '@angular/material/bottom-sheet';
import { Status, StatusType } from '../model';
import { StatusComponent } from 'app/shared/component/status/status.component';

@Injectable()
export class NotificationService {

  onSuccess(bottomSheet: MatBottomSheet, message: string | object): void {
    this.showStatus(bottomSheet, this.createStatus(StatusType.SUCCESS, message));
  }

  onWarning(bottomSheet: MatBottomSheet, warning: string | object): void {
    this.showStatus(bottomSheet, this.createStatus(StatusType.WARNING, warning));
  }

  onError(bottomSheet: MatBottomSheet, error: string | object): void {
    this.showStatus(bottomSheet, this.createStatus(StatusType.ERROR, error));
  }

  showStatus(bottomSheet: MatBottomSheet, status: Status): void {
    const config: MatBottomSheetConfig = { data: { status }, panelClass: status.type };
    bottomSheet.open(StatusComponent, config);
  }

  private createStatus(statusType: StatusType, value: string | object): Status {
    return { type: statusType, msg: this.toMessage(value) };
  }

  private toMessage(value: string | object): string {
    if (typeof value === 'string') {
      return value;
    } else if (value['name'] && value['message']) {
      return value['name'] + ': ' + value['message'];
    }
    return JSON.stringify(value);
  }
}
