import { NotificationService } from '../services';

export class NotificationServiceMock extends NotificationService {

   constructor() {
      super();
   }

   override showStatus(): void {
      // ignore
   }
}
