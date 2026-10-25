import { LanguageService } from '../../language';
import { Query } from 'app/shared/model';
import { DBService } from '../db.service';
import { ConfirmDialogData } from 'app/shared/component/confirm-dialog/confirm-dialog/confirm-dialog.component';
import { DialogService } from '../../dialog.service';

/**
 * CouchDB's _find doesn't include documents lacking the sort field: sorting requires an index containing the sort field
 * and a JSON index only contains documents having all indexed fields present
 * (see https://docs.couchdb.org/en/stable/api/database/find.html), the user is informed about this limitation
 */
export class SortLimitationWorkaround {

   private static dialogData: ConfirmDialogData;
   private static dialogDataLocale: string;

   /**
    * @returns the data of the info dialog in the current language, the same instance as long as the language does not change
    * (it remembers the choice of the user)
    */
   static get couchDbSortLimitationDialogData(): ConfirmDialogData {
      const locale = LanguageService.localeId();
      if (!this.dialogData || this.dialogDataLocale !== locale) {
         const data = new ConfirmDialogData(LanguageService.instant('dialog.couchDbLimitation'),
            '<p>' + LanguageService.instant('dialog.couchDbSortLimitation') + '</p>', [LanguageService.instant('dialog.gotIt')], true);
         data.rememberChoice = !!this.dialogData?.rememberChoice;
         this.dialogData = data;
         this.dialogDataLocale = locale;
      }
      return this.dialogData;
   }

   static showInfoDialog(dbService: DBService, dialogService: DialogService, query: Query): void {
      if (dbService.isCouchDbInUse() && query.hasSort() && !SortLimitationWorkaround.couchDbSortLimitationDialogData.rememberChoice) {
         dialogService.showConfirmDialog(SortLimitationWorkaround.couchDbSortLimitationDialogData);
      }
   }
}
