import { Component } from '@angular/core';

@Component({
   selector: 'retro-raw-data-view',
   template: `<mat-drawer-container fullscreen>
                <retro-raw-data [dialogStyle]="false"></retro-raw-data>
              </mat-drawer-container>`,
})
export class RawDataViewComponent {
}
