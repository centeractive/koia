import { ChangeDetectionStrategy, Component } from '@angular/core';
import { USER_MANUAL_URL } from 'app/shared/utils/user-manual';

/**
 * opens the user manual in a new tab
 */
@Component({
  selector: 'koia-manual-link',
  template: `
    <a id="butManual" mat-icon-button [href]="userManualUrl" target="_blank" rel="noopener"
      [matTooltip]="'toolbar.manual' | translate" [attr.aria-label]="'toolbar.manual' | translate">
      <mat-icon>help_outline</mat-icon>
    </a>`,
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class ManualLinkComponent {

  readonly userManualUrl = USER_MANUAL_URL;
}
