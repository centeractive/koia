import { NotificationService } from '../services';
import { MatBottomSheet } from '@angular/material';
import { Status } from '../model';

export abstract class AbstractComponent {

  constructor(private bottomSheet: MatBottomSheet, private notificationService: NotificationService) { };

  notifySuccess(message: string) {
    this.notificationService.onSuccess(this.bottomSheet, message);
  }

  notifyWarning(message: string) {
    this.notificationService.onWarning(this.bottomSheet, message);
  }

  notifyError(error: string | Object) {
    this.notificationService.onError(this.bottomSheet, error);
  }

  showStatus(status: Status): void {
    this.notificationService.showStatus(this.bottomSheet, status);
  }
}
