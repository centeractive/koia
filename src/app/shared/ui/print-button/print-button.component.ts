import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'koia-print-button',
  template: `
    <button id="but_print" mat-icon-button [matTooltip]="'view.print' | translate" [disabled]="disabled" (click)="print()">
      <mat-icon>print</mat-icon>
    </button>`,
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class PrintButtonComponent {

  @Input() disabled = false;

  print(): void {
    window.print();
  }
}
