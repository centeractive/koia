import { NotificationService } from '../services';
import { MatBottomSheet } from '@angular/material';
import { Status } from '../model';

export class NotificationServiceMock extends NotificationService {

   constructor() {
      super();
   }

   showStatus(bottomSheet: MatBottomSheet, status: Status): void {
   }
}
