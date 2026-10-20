import { Directive, OnInit } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Router } from '@angular/router';
import { AbstractComponent } from '../component/abstract.component';
import { Route, Scene } from '../model';
import { NotificationService } from '../services';
import { DBService } from '../services/backend';

@Directive()
export abstract class ConfigController extends AbstractComponent implements OnInit {

   protected scene: Scene;

   constructor(public route: Route, private router: Router, bottomSheet: MatBottomSheet, public dbService: DBService,
      notificationService: NotificationService) {
      super(bottomSheet, notificationService);
   }

   ngOnInit(): void {
      this.scene = this.dbService.getActiveScene();
      if (this.scene) {
         this.init();
      } else {
         this.router.navigateByUrl(Route.SCENES);
      }
   }

   abstract init(): void;
}
