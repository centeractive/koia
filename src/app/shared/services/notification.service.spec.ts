import { TestBed } from '@angular/core/testing';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { StatusType } from '../model';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {

   let notificationService: NotificationService;
   let bottomSheet: MatBottomSheet;

   beforeEach(() => {
      TestBed.configureTestingModule({
         imports: [MatBottomSheetModule],
         providers: [MatBottomSheet]
      });
      notificationService = new NotificationService();
      bottomSheet = TestBed.inject(MatBottomSheet);
      spyOn(bottomSheet, 'open');
      spyOn(console, 'error');
   });

   it('#onSuccess should show success', () => {

      // when
      notificationService.onSuccess(bottomSheet, 'well done!');

      // then
      expect(bottomSheet.open).toHaveBeenCalled();
   });

   it('#onWarning should show warning', () => {

      // when
      notificationService.onWarning(bottomSheet, { id: 1, message: 'careful!' });

      // then
      expect(bottomSheet.open).toHaveBeenCalled();
   });

   it('#onError should show error', () => {

      // when
      notificationService.onError(bottomSheet, new Error('big problem!'));

      // then
      expect(bottomSheet.open).toHaveBeenCalled();
   });

   it('#showStatus should show status', () => {

      // when
      notificationService.showStatus(bottomSheet, { type: StatusType.ERROR, msg: 'error occurred' });

      // then
      expect(bottomSheet.open).toHaveBeenCalled();
   });
});
