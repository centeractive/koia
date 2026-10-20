import { Injectable } from '@angular/core';
import { promptViewName } from 'app/shared/controller/view-name-prompt';
import { Scene, Status } from '../../model';
import { SavedView } from '../../model/view-config';
import { CommonUtils } from '../../utils';
import { DBService } from '../backend';
import { DialogService } from '../dialog.service';
import { ViewPersistenceService } from '../view-persistence/view-persistence.service';
import { ViewTabsService } from '../view-tabs';
import { RawDataStateService } from './raw-data-state.service';
import { SavedViewRestorer } from './saved-view-restorer';

/**
 * saves, restores and manages views of the active scene, each containing all tabs together with the raw data state
 */
@Injectable({
   providedIn: 'root'
})
export class SavedViewsService {

   private lastName: { scene: Scene, name: string };

   constructor(private dbService: DBService, private viewTabsService: ViewTabsService, private rawDataStateService: RawDataStateService,
      private viewPersistenceService: ViewPersistenceService, private dialogService: DialogService, private restorer: SavedViewRestorer) { }

   get ready(): boolean {
      return this.viewTabsService.ready;
   }

   findAll(): SavedView[] {
      const scene = this.dbService.getActiveScene();
      return scene ? this.viewPersistenceService.findSavedViews(scene) : [];
   }

   /**
    * @returns a promise that provides the status of persisting or undefined when the user canceled
    */
   async save(activeTabId: string | undefined): Promise<Status | undefined> {
      const scene = this.dbService.getActiveScene();
      const name = await promptViewName(this.dialogService, this.lastName?.scene === scene ? this.lastName.name : '');
      if (name === undefined) {
         return undefined;
      }
      this.lastName = { scene, name };
      const tabs = this.viewTabsService.tabs.map(t => this.viewTabsService.currentTab(t));
      return this.viewPersistenceService.saveView(scene, {
         name,
         modifiedTime: new Date().getTime(),
         tabs: CommonUtils.clone(tabs),
         activeTabId,
         rawData: CommonUtils.clone(this.rawDataStateService.current())
      });
   }

   async restore(view: SavedView): Promise<void> {
      if (await this.restorer.restore(view)) {
         this.lastName = { scene: this.dbService.getActiveScene(), name: view.name };
      }
   }

   manage(onUpdated: (status: Status) => void): void {
      const scene = this.dbService.getActiveScene();
      this.dialogService.showManageViewDialog<SavedView>({
         views: this.viewPersistenceService.findSavedViews(scene),
         updateViews: (deleted, renamed) => this.viewPersistenceService.updateViews(scene, deleted, renamed).then(onUpdated)
      });
   }
}
