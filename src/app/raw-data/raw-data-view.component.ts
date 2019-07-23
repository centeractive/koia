import { Component } from '@angular/core';

@Component({
   selector: 'koia-raw-data-view',
   template: `<mat-drawer-container fullscreen>
                <koia-raw-data [dialogStyle]="false"></koia-raw-data>
              </mat-drawer-container>`,
})
export class RawDataViewComponent {
}
