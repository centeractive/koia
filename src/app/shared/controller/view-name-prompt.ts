import { firstValueFrom } from 'rxjs';
import { InputDialogData } from '../component/input-dialog/input-dialog.component';
import { DialogService } from '../services/dialog.service';
import { LanguageService } from '../services/language';

export const VIEW_NAME_MAX_LENGTH = 40;

/**
 * @returns a promise that provides the entered view name or undefined when the dialog was canceled
 */
export function promptViewName(dialogService: DialogService, currentName: string): Promise<string | undefined> {
   const dialogData = new InputDialogData(LanguageService.instant('view.saveTitle'), LanguageService.instant('view.name'),
      currentName, VIEW_NAME_MAX_LENGTH);
   return firstValueFrom(dialogService.showInputDialog(dialogData).afterClosed())
      .then(() => dialogData.closedWithOK ? dialogData.input : undefined);
}
