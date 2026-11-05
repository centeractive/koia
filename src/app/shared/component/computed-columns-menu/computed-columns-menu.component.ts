import { ChangeDetectionStrategy, Component, Input, ViewChild } from '@angular/core';
import { MatMenu } from '@angular/material/menu';
import { Column } from 'app/shared/model';
import { ComputedColumnService } from 'app/shared/services/computed-column.service';
import { DialogService } from 'app/shared/services/dialog.service';
import { computedColumnTooltipOf } from 'app/shared/utils/computation-utils';

/**
 * submenu to create a computed column or to edit an existing one
 */
@Component({
  selector: 'koia-computed-columns-menu',
  templateUrl: './computed-columns-menu.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class ComputedColumnsMenuComponent {

  @Input() entriesProvider: () => object[];
  @ViewChild(MatMenu, { static: true }) readonly menu: MatMenu;

  readonly tooltipOf = computedColumnTooltipOf;

  constructor(private computedColumnService: ComputedColumnService, private dialogService: DialogService) { }

  get creatable(): boolean {
    return this.computedColumnService.canCreate();
  }

  get columns(): Column[] {
    return this.computedColumnService.columns();
  }

  async openDialog(column?: Column): Promise<void> {
    await this.dialogService.editComputedColumn(this.entriesProvider(), column);
  }
}
