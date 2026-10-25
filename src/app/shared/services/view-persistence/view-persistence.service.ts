import { LanguageService } from '../language';
import { Injectable } from '@angular/core';
import type { ViewRename } from 'app/shared/component/manage-view-dialog/manage-view-context.type';
import { Config, SavedView } from 'app/shared/model/view-config';
import { Scene, Status, StatusType } from '../../model';
import { ArrayUtils } from '../../utils';
import { DBService } from '../backend';
import { convertLegacyViews } from './legacy-view-converter';

@Injectable({
   providedIn: 'root'
})
export class ViewPersistenceService {

   constructor(private dbService: DBService) { }

   /**
    * @returns [[SavedView]]s of the [[Scene]] descending sorted by their modified time
    */
   findSavedViews(scene: Scene): SavedView[] {
      return [...this.savedViewsOf(scene)].sort((v1, v2) => v2.modifiedTime - v1.modifiedTime);
   }

   /**
    * adds the specified [[SavedView]] or replaces the one with the same name, then updates the [[Scene]] in the backing
    * datastore.
    *
    * @returns a promise that provides the resolved processing status (success or error), hence there's no need for the
    * invoking part to catch errors
    */
   saveView(scene: Scene, view: SavedView): Promise<Status> {
      const restore = this.restorerOf(scene, []);
      const savedViews = this.savedViewsOf(scene);
      const prevView = savedViews.find(v => v.name === view.name);
      if (prevView) {
         ArrayUtils.replaceElement(savedViews, prevView, view);
      } else {
         savedViews.push(view);
      }
      return this.updateScene(scene, restore, LanguageService.instant('view.saved', { name: view.name }),
         e => LanguageService.instant('view.notSaved', { name: view.name, error: e }));
   }

   /**
    * removes the deleted [[SavedView]]s from the [[Scene]], renames the renamed ones and updates the [[Scene]] in the backing
    * datastore, both changes are undone when the update fails
    *
    * @returns a promise that provides the resolved processing status (success or error)
    */
   updateViews(scene: Scene, deletedViews: SavedView[], renames: ViewRename<SavedView>[]): Promise<Status> {
      const restore = this.restorerOf(scene, renames.map(r => r.view));
      scene.config.savedViews = this.without(this.savedViewsOf(scene), deletedViews);
      renames.forEach(r => r.view.name = r.name);
      return this.updateScene(scene, restore, this.updateMessage(deletedViews.length, renames.length),
         e => LanguageService.instant('view.notUpdated', { error: e }));
   }

   private savedViewsOf(scene: Scene): SavedView[] {
      const config = scene.config;
      if (!config.savedViews || config.views || config.records) {
         const savedViews = config.savedViews ?? [];
         config.savedViews = [...savedViews, ...convertLegacyViews(config, savedViews.map(v => v.name))];
         delete config.views;
         delete config.records;
      }
      return config.savedViews;
   }

   /**
    * @returns a function that brings back the current config of the [[Scene]] and the current names of the views
    */
   private restorerOf(scene: Scene, views: SavedView[]): () => void {
      const config: Config = { ...scene.config, savedViews: scene.config.savedViews?.slice() };
      const names = views.map(v => v.name);
      return () => {
         scene.config = config;
         views.forEach((v, i) => v.name = names[i]);
      };
   }

   private without<T>(items: T[], removedItems: T[]): T[] {
      return items.filter(i => !removedItems.includes(i));
   }

   private updateMessage(deletedCount: number, renamedCount: number): string {
      const message: string[] = [];
      if (deletedCount) {
         message.push(LanguageService.instant(deletedCount === 1 ? 'view.deletedOne' : 'view.deleted', { count: deletedCount }));
      }
      if (renamedCount) {
         message.push(LanguageService.instant(renamedCount === 1 ? 'view.renamedOne' : 'view.renamed', { count: renamedCount }));
      }
      return message.join('\n');
   }

   private updateScene(scene: Scene, restore: () => void, successMsg: string, errorMsg: (error: string) => string): Promise<Status> {
      return this.dbService.updateScene(scene)
         .then((): Status => ({ type: StatusType.SUCCESS, msg: successMsg }))
         .catch((e): Status => {
            restore();
            return { type: StatusType.ERROR, msg: errorMsg(typeof e === 'string' ? e : e.message) };
         });
   }
}
