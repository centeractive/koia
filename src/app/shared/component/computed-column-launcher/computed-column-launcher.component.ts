import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Column } from 'app/shared/model';
import { ComputedColumnService } from 'app/shared/services/computed-column.service';
import { DialogService } from 'app/shared/services/dialog.service';

/**
 * opens the computed column dialog, to edit the specified column or to create a new one when no column is specified
 */
@Component({
  selector: 'koia-computed-column-launcher',
  templateUrl: './computed-column-launcher.component.html',
  styleUrls: ['./computed-column-launcher.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class ComputedColumnLauncherComponent {

  @Input() column: Column;
  @Input() entries: object[];
  @Output() columnSaved = new EventEmitter<Column>();

  constructor(private computedColumnService: ComputedColumnService, private dialogService: DialogService) { }

  get creatable(): boolean {
    return this.computedColumnService.canCreate();
  }

  async openDialog(): Promise<void> {
    const savedColumn = await this.dialogService.editComputedColumn(this.entries ?? [], this.column);
    if (savedColumn) {
      this.columnSaved.emit(savedColumn);
    }
  }
}
