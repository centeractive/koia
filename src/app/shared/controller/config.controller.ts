import { Directive, OnInit } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Router } from '@angular/router';
import { AbstractComponent } from '../component/abstract.component';
import { ConfigLauncherContext } from '../component/config-launcher-dialog';
import { ManageConfigContext } from '../component/manage-view-dialog';
import { Query, Route, Scene } from '../model';
import { ConfigRecord } from '../model/view-config';
import { DialogService, NotificationService, ViewPersistenceService } from '../services';
import { DBService } from '../services/backend';
import { promptViewName } from './view-name-prompt';

@Directive()
export abstract class ConfigController extends AbstractComponent implements OnInit, ConfigLauncherContext, ManageConfigContext {

   configRecords: ConfigRecord[] = [];

   protected scene: Scene;
   protected currentViewName = '';

   constructor(public route: Route, private router: Router, bottomSheet: MatBottomSheet, public dbService: DBService, public dialogService: DialogService,
      public viewPersistenceService: ViewPersistenceService, notificationService: NotificationService) {
      super(bottomSheet, notificationService);
   }

   ngOnInit(): void {
      this.scene = this.dbService.getActiveScene();
      if (this.scene) {
         this.refreshRecords();
         this.init();
      } else {
         this.router.navigateByUrl(Route.SCENES);
      }
   }

   abstract init(): void;

   abstract configToBeSaved(): { query: Query, data: unknown };

   private refreshRecords(): void {
      this.configRecords = this.viewPersistenceService.findRecords(this.scene, this.route);
   }

   saveConfig(): void {
      promptViewName(this.dialogService, this.currentViewName).then(viewName => {
         if (viewName !== undefined) {
            const config = this.configToBeSaved();
            this.currentViewName = viewName;
            this.viewPersistenceService.saveRecord(this.scene, this.route, viewName, config.query, config.data)
               .then(s => {
                  this.showStatus(s);
                  this.refreshRecords();
               });
         }
      });
   }

   selectConfig(): void {
      this.dialogService.showConfigLauncherDialog(this);
   }

   abstract loadConfig(configRecord: ConfigRecord): void;

   manageViews(): void {
      this.dialogService.showManageConfigDialog(this);
   }

   async updateConfigRecords(deletedRecords: ConfigRecord[], renamedRecords: ConfigRecord[]): Promise<void> {
      const status = await this.viewPersistenceService.updateRecords(this.scene, deletedRecords, renamedRecords);
      this.refreshRecords();
      this.showStatus(status);
   }
}
