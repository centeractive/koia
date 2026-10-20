import { firstValueFrom } from 'rxjs';
import { ConfirmDialogData } from '../component/confirm-dialog/confirm-dialog/confirm-dialog.component';
import { DialogService } from '../services/dialog.service';

/**
 * @param question HTML formatted question, it is wrapped into a paragraph
 * @returns a promise that provides true when the user answered with 'Yes'
 */
export async function confirmYesNo(dialogService: DialogService, title: string, question: string): Promise<boolean> {
   const data = new ConfirmDialogData(title, '<p>' + question + '</p>', ConfirmDialogData.YES_NO);
   await firstValueFrom(dialogService.showConfirmDialog(data).afterClosed());
   return data.closedWithButtonIndex === 0;
}
