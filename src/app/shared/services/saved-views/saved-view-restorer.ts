import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogData } from '../../component/confirm-dialog/confirm-dialog/confirm-dialog.component';
import { Route } from '../../model';
import { SavedView, TabDef } from '../../model/view-config';
import { CommonUtils } from '../../utils';
import { DialogService } from '../dialog.service';
import { LanguageService } from '../language';
import { hasContent, tabUrl, ViewTabsService } from '../view-tabs';
import { RawDataStateService } from './raw-data-state.service';

@Injectable({
   providedIn: 'root'
})
export class SavedViewRestorer {

   constructor(private viewTabsService: ViewTabsService, private rawDataStateService: RawDataStateService,
      private dialogService: DialogService, private router: Router) { }

   /**
    * replaces all open tabs and the raw data state by the ones of the view, cached tab components are rebuilt from it
    *
    * @returns true when tabs were replaced, false when the user declined or raw data could not be shown
    */
   async restore(view: SavedView): Promise<boolean> {
      if (this.hasOpenContent() && !await this.confirmed(view)) {
         return false;
      }
      await this.router.navigateByUrl('/' + Route.RAWDATA);
      if (this.router.url !== '/' + Route.RAWDATA) {
         return false;
      }
      const tabs: TabDef[] = CommonUtils.clone(view.tabs);
      this.viewTabsService.replaceTabs(tabs);
      this.rawDataStateService.apply(CommonUtils.clone(view.rawData));
      if (tabs.some(t => t.id === view.activeTabId)) {
         await this.router.navigateByUrl(tabUrl(view.activeTabId));
      }
      return true;
   }

   private hasOpenContent(): boolean {
      return this.viewTabsService.tabs.some(t => hasContent(this.viewTabsService.currentTab(t)));
   }

   private async confirmed(view: SavedView): Promise<boolean> {
      const data = new ConfirmDialogData(LanguageService.instant('view.restoreTitle'),
         '<p>' + LanguageService.instant('view.restoreQuestion', { name: _.escape(view.name) }) + '</p>', ConfirmDialogData.YES_NO);
      await firstValueFrom(this.dialogService.showConfirmDialog(data).afterClosed());
      return data.closedWithButtonIndex === 0;
   }
}
