import { Input, Component } from '@angular/core';
import { MatIcon } from '@angular/material';
import { MetadataOverride } from '@angular/core/testing';
import { NgModule } from '@angular/compiler/src/core';

/**
 * Use this to avoid "icon not found" errors during unit testing. Such icons are added to the MatIconRegistry 
 * within the [[AppComponent]] class and used in the templates as follows.
 *
 * <mat-icon svgIcon="icon_name"></mat-icon>
 *
 * @see https://stackoverflow.com/a/55528306/2358409
 */
@Component({
   selector: 'koia-mat-icon-module-mock',
   template: '<span></span>'
})
// tslint:disable-next-line:component-class-suffix
export class MatIconModuleMock {

   @Input() svgIcon: any;
   @Input() fontSet: any;
   @Input() fontIcon: any;

   selector: 'mat-icon';
   template: '<span></span>';

   static override(): MetadataOverride<NgModule> {
      return {
         remove: {
            declarations: [MatIcon],
            exports: [MatIcon]
         },
         add: {
            declarations: [MatIconModuleMock],
            exports: [MatIconModuleMock]
         }
      }
   }
};
