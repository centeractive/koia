import { LanguageService } from '../language';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AppRouteReuseStrategy } from 'app/app-route-reuse-strategy';
import { Route, Scene } from '../../model';
import { TabDef, ViewType } from '../../model/view-config';
import { DBService } from '../backend';
import { ViewColumnRenamer } from '../view-persistence/view-column-renamer';
import { TabContentProvider } from './tab-content-provider.type';
import { createTabDef, maxTabSeq, tabPath, tabUrl } from './tab-defs';
import { TabsPersister } from './tabs-persister';

/**
 * manages the dynamic tabs (pivot tables and dashboards) of the active scene
 */
@Injectable({
   providedIn: 'root'
})
export class ViewTabsService {

   private scene: Scene;
   private _tabs: TabDef[] = [];
   private _ready = false;
   private seq = 0;
   private providers = new Map<string, TabContentProvider>();

   constructor(private dbService: DBService, private persister: TabsPersister, private router: Router) { }

   get tabs(): TabDef[] {
      this.syncWithActiveScene();
      return this._tabs;
   }

   get ready(): boolean {
      this.syncWithActiveScene();
      return this._ready;
   }

   findTab(id: string): TabDef {
      return this.tabs.find(t => t.id === id);
   }

   addTab(type: ViewType): Promise<boolean> {
      const tabs = this.tabs;
      const tab = createTabDef(type, ++this.seq, tabs);
      tabs.push(tab);
      this.persistNow();
      return this.router.navigateByUrl(tabUrl(tab.id));
   }

   renameTab(tab: TabDef, title: string): void {
      this.syncWithActiveScene();
      tab.title = title;
      this.persistNow();
   }

   async closeTab(tab: TabDef, currUrl: string): Promise<void> {
      const tabs = this.tabs;
      const index = tabs.indexOf(tab);
      tabs.splice(index, 1);
      this.providers.delete(tab.id);
      this.persistNow();
      if (currUrl === tabUrl(tab.id)) {
         const neighbour = tabs[index] ?? tabs[index - 1];
         await this.router.navigateByUrl(neighbour ? tabUrl(neighbour.id) : '/' + Route.RAWDATA);
      }
      this.evict(tab.id);
   }

   evict(id: string): void {
      (this.router.routeReuseStrategy as AppRouteReuseStrategy).evict(tabPath(id));
   }

   register(id: string, provider: TabContentProvider): void {
      this.providers.set(id, provider);
   }

   /**
    * keeps the last content of the tab since the provider (component) is about to be destroyed
    */
   unregister(id: string, provider: TabContentProvider): void {
      if (this.providers.get(id) === provider) {
         const tab = this._tabs.find(t => t.id === id);
         if (tab) {
            Object.assign(tab, provider.tabContent());
         }
         this.providers.delete(id);
      }
   }

   currentTab(tab: TabDef): TabDef {
      return { ...tab, ...this.providers.get(tab.id)?.tabContent() };
   }

   layoutOf(tab: TabDef): Route {
      return this.providers.get(tab.id)?.layout();
   }

   /**
    * renames the column in the views of all tabs and requests persisting them
    */
   renameColumn(previousName: string, name: string): void {
      const renamer = new ViewColumnRenamer(previousName, name);
      this.tabs.filter(t => t.view).forEach(t => renamer.renameInView(t.view));
      this.requestPersist();
   }

   requestPersist(): void {
      this.syncWithActiveScene();
      if (this._ready) {
         this.persister.request(() => this.snapshot());
      }
   }

   private persistNow(): void {
      if (this._ready) {
         this.persister.persistNow(() => this.snapshot());
      }
   }

   private snapshot(): TabDef[] {
      this._tabs.forEach(t => {
         const provider = this.providers.get(t.id);
         if (provider) {
            Object.assign(t, provider.tabContent());
         }
      });
      return this._tabs;
   }

   private syncWithActiveScene(): void {
      const scene = this.dbService.getActiveScene();
      if (scene === this.scene) {
         return;
      }
      if (scene) {
         this.persister.flush();
      } else {
         this.persister.cancel();
      }
      this.scene = scene;
      this._ready = false;
      this._tabs = [];
      this.seq = 0;
      this.providers.clear();
      if (scene) {
         this.loadTabs(scene);
      }
   }

   private loadTabs(scene: Scene): void {
      this.dbService.findSceneTabs(scene._id)
         .then(doc => {
            if (scene === this.scene) {
               const sceneTabs = doc ?? { _id: DBService.sceneTabsId(scene._id), tabs: [] };
               this._tabs = sceneTabs.tabs;
               this.seq = maxTabSeq(this._tabs);
               this.persister.reset(sceneTabs);
               this._ready = true;
            }
         })
         .catch(err => this.persister.reportError(LanguageService.instant('view.tabsNotLoaded') + ' ', err));
   }
}
