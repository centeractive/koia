import { NotificationService } from '../services';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Status } from '../model';

export class NotificationServiceMock extends NotificationService {

   constructor() {
      super();
   }

   override showStatus(bottomSheet: MatBottomSheet, status: Status): void {
      // ignore
   }
}
