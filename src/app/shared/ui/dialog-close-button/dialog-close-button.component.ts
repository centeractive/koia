import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'koia-dialog-close-button',
  template: `
    <button id="but_close_dialog" mat-dialog-close matTooltip="Close" aria-label="Close">
      <mat-icon>close</mat-icon>
    </button>`,
  styles: [`
    :host {
      position: absolute;
      top: 12px;
      right: 8px;
      z-index: 3;
    }
    button {
      padding: 0;
      border: none;
      background: none;
      color: inherit;
      cursor: pointer;
      line-height: 0;
    }`],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class DialogCloseButtonComponent {
}
