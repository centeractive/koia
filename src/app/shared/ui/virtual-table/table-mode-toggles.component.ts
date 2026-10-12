import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Column, DataType } from 'app/shared/model';

@Component({
  selector: 'koia-table-mode-toggles',
  template: `<button mat-icon-button [class.koia-toggle-active]="multiLine"
               [matTooltip]="multiLine ? 'Show single-line rows' : 'Show multi-line rows'" (click)="multiLineChange.emit(!multiLine)">
               <mat-icon>format_line_spacing</mat-icon>
             </button>
             @if (hasObjectColumn) {
               <button mat-icon-button [class.koia-toggle-active]="showNestedObjects"
                 [matTooltip]="showNestedObjects ? 'Hide nested objects' : 'Show nested objects'"
                 (click)="showNestedObjectsChange.emit(!showNestedObjects)">
                 <mat-icon>code</mat-icon>
               </button>
             }`,
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class TableModeTogglesComponent {

  @Input() columns: Column[];
  @Input() multiLine: boolean;
  @Input() showNestedObjects: boolean;
  @Output() multiLineChange = new EventEmitter<boolean>();
  @Output() showNestedObjectsChange = new EventEmitter<boolean>();

  get hasObjectColumn(): boolean {
    return this.columns.some(c => c.dataType === DataType.OBJECT);
  }
}
