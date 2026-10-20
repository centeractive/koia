import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Column } from 'app/shared/model';
import { ComputedColumnService } from 'app/shared/services/computed-column.service';
import { DialogService } from 'app/shared/services/dialog.service';
import { firstValueFrom } from 'rxjs';
import { ComputedColumnDialogData } from '../computed-column-dialog/computed-column-dialog.component';

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
    return this.computedColumnService.operandColumns().length > 0;
  }

  async openDialog(): Promise<void> {
    const data = new ComputedColumnDialogData(this.entries ?? [], this.column);
    await firstValueFrom(this.dialogService.showComputedColumnDialog(data).afterClosed());
    if (data.savedColumn) {
      this.columnSaved.emit(data.savedColumn);
    }
  }
}
