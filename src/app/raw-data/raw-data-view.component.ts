import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'koia-raw-data-view',
  template: `<mat-drawer-container fullscreen>
                <koia-raw-data [dialogStyle]="false" />
              </mat-drawer-container>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class RawDataViewComponent {
}
