import { Directive, OnInit } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AbstractComponent } from '../component/abstract.component';
import { ConfigLauncherContext } from '../component/config-launcher-dialog';
import { InputDialogData } from '../component/input-dialog/input-dialog.component';
import { ManageConfigContext } from '../component/manage-config-dialog';
import { Query, Route, Scene } from '../model';
import { ConfigRecord } from '../model/view-config';
import { DialogService, NotificationService, ViewPersistenceService } from '../services';
import { DBService } from '../services/backend';
import { StringUtils } from '../utils';

@Directive()
export abstract class ConfigController extends AbstractComponent implements OnInit, ConfigLauncherContext, ManageConfigContext {

   configRecords: ConfigRecord[] = [];

   protected scene: Scene;

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

   abstract configToBeSaved(): { query: Query, data: any };

   private refreshRecords(): void {
      this.configRecords = this.viewPersistenceService.findRecords(this.scene, this.route);
   }

   saveConfig(): void {
      const dialogData = new InputDialogData('Save View', 'View Name', '', 20);
      const dialogRef = this.dialogService.showInputDialog(dialogData);
      firstValueFrom(dialogRef.afterClosed()).then(() => {
         if (dialogData.closedWithOK) {
            const config = this.configToBeSaved();
            this.viewPersistenceService.saveRecord(this.scene, this.route, dialogData.input, config.query, config.data)
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

   // TODO: move most of this code to the ViewPersistenceService
   updateConfigRecords(deletedRecords: ConfigRecord[], renamedRecords: ConfigRecord[]): void {
      const deltedRecordsNames = deletedRecords.map(v => v.name);
      this.scene.config.records = this.scene.config.records
         .filter(v => !deltedRecordsNames.includes(v.name));
      this.refreshRecords();
      this.dbService.persistScene(this.scene, false);
      this.notifyUpdatedRecords(deletedRecords, renamedRecords);
   }

   private notifyUpdatedRecords(deletedRecords: ConfigRecord[], renamedRecords: ConfigRecord[]): void {
      const message: string[] = [];
      if (deletedRecords.length) {
         message.push('Deleted ' + deletedRecords.length + StringUtils.pluralize(' view', deletedRecords.length));
      }
      if (renamedRecords.length) {
         message.push('Renamed ' + renamedRecords.length + StringUtils.pluralize(' view', renamedRecords.length));
      }
      this.notifySuccess(message.join('\n'));
   }
}
