import { LanguageService } from '../language';
import { Injectable, OnDestroy } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { SceneTabs, TabDef } from '../../model/view-config';
import { DBService } from '../backend';
import { NotificationService } from '../notification.service';

/**
 * persists the open tabs of a scene with a delay and only when they changed since last time
 */
@Injectable({
   providedIn: 'root'
})
export class TabsPersister implements OnDestroy {

   static readonly DELAY_MS = 1_000;

   private doc: SceneTabs;
   private lastJson: string;
   private pendingSnapshot: () => TabDef[];
   private timer: ReturnType<typeof setTimeout>;
   private writes: Promise<unknown> = Promise.resolve();
   private errorReported = false;
   private destroyed = false;

   constructor(private dbService: DBService, private notificationService: NotificationService, private bottomSheet: MatBottomSheet) { }

   reset(doc: SceneTabs): void {
      this.doc = doc;
      this.lastJson = JSON.stringify(doc.tabs);
   }

   request(snapshot: () => TabDef[]): void {
      this.clearTimer();
      this.pendingSnapshot = snapshot;
      this.timer = setTimeout(() => this.flush(), TabsPersister.DELAY_MS);
   }

   persistNow(snapshot: () => TabDef[]): Promise<unknown> {
      this.cancel();
      return this.write(snapshot);
   }

   flush(): Promise<unknown> {
      const snapshot = this.pendingSnapshot;
      this.cancel();
      return snapshot ? this.write(snapshot) : this.writes;
   }

   cancel(): void {
      this.clearTimer();
      this.pendingSnapshot = undefined;
   }

   reportError(prefix: string, error: string | { message?: string }): void {
      if (!this.errorReported && !this.destroyed) {
         this.errorReported = true;
         const message = typeof error === 'string' ? error : error?.message;
         this.notificationService.onError(this.bottomSheet, prefix + message);
      }
   }

   ngOnDestroy(): void {
      this.destroyed = true;
      this.cancel();
   }

   private clearTimer(): void {
      clearTimeout(this.timer);
      this.timer = undefined;
   }

   private write(snapshot: () => TabDef[]): Promise<unknown> {
      const json = JSON.stringify(snapshot());
      if (json === this.lastJson) {
         return this.writes;
      }
      const doc = this.doc;
      const prevJson = this.lastJson;
      this.lastJson = json;
      doc.tabs = JSON.parse(json);
      this.writes = this.writes
         .then(() => this.dbService.saveSceneTabs(doc))
         .then(() => { this.errorReported = false; })
         .catch(err => {
            if (this.lastJson === json) {
               this.lastJson = prevJson;
            }
            this.reportError(LanguageService.instant('view.tabsNotSaved') + ' ', err);
         });
      return this.writes;
   }
}
