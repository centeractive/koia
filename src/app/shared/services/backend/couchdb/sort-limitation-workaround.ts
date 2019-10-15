import { MangoQueryBuilder } from '../mango';
import { Query, Page } from 'app/shared/model';
import { DBService } from '../db.service';
import { ConfirmDialogData } from 'app/shared/component/confirm-dialog/confirm-dialog/confirm-dialog.component';
import { DialogService } from '../../dialog.service';
import { CommonUtils } from 'app/shared/utils';

/**
 * CouchDB (v. 2.3.1) doesn't include documents in the _find result if they don't contain the field (attribute) specified in sort
 * (see https://stackoverflow.com/a/58351340/2358409). Therefore, we...
 * - cannot simply count all entries from the active scene if the query has filters
 * - need to count matching entries each time the sort condition changes
 * - need to query all matching IDs using the sort conditions
 * - have to inform the user about the limitation
 *
 * TODO: check in future versions of CouchDB if this limitation (bug) still exists and possibly get rid of this class
 */
export class SortLimitationWorkaround {

   static readonly couchDbSortLimitationDialogData = new ConfirmDialogData('CouchDB Limitation',
      '<p>CouchDB query results don\'t include rows where the value of the sort field is missing.</p>', ['Got it'], true);

   static isCouchDbWithSort(dbService: DBService, query: Query): boolean {
      return dbService.isCouchDbInUse() && query.hasSort();
   }

   static isCouchDbWithChangedSort(dbService: DBService, query: Query, prevPage: Page): boolean {
      return dbService.isCouchDbInUse() && !CommonUtils.compare(query.getSort(), prevPage.query.getSort());
   }

   static sortByMatchingIDsQueryWhenCouchDbWithSort(couchDB: boolean, builder: MangoQueryBuilder, query: Query): void {
      if (couchDB && query.hasSort()) {
         builder.sortBy(query.getSort());
      }
   }

   static showInfoDialog(dbService: DBService, dialogService: DialogService, query: Query): void {
      if (dbService.isCouchDbInUse() && query.hasSort() && !SortLimitationWorkaround.couchDbSortLimitationDialogData.rememberChoice) {
         dialogService.showConfirmDialog(SortLimitationWorkaround.couchDbSortLimitationDialogData);
      }
   }
}
