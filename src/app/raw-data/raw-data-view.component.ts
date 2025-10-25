import { Component } from '@angular/core';

@Component({
  selector: 'koia-raw-data-view',
  template: `<mat-drawer-container fullscreen>
                <koia-raw-data [dialogStyle]="false" />
              </mat-drawer-container>`,
  standalone: false
})
export class RawDataViewComponent {
}
