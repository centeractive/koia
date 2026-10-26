import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AbstractComponent } from 'app/shared/component/abstract.component';
import { Column, EnumLabels, Scene, TimeUnit } from 'app/shared/model';
import { EnumLabelKeys } from 'app/shared/model/enum-label-keys';
import { NotificationService } from 'app/shared/services/notification.service';
import { LanguageService } from 'app/shared/services/language';
import { PatternColumnService } from 'app/shared/services/pattern-column.service';
import { canDerivePattern, isComputedColumn, isPatternColumn, PATTERN_COLUMN_ICON } from 'app/shared/utils/column-utils';
import { computedColumnTooltipOf } from 'app/shared/utils/computation-utils';
import { colWidthMeasurementToDisplay } from 'app/shared/utils/source-system';

/**
 * pattern columns can be added to the scene when it is editable
 */
export interface SceneDetailsDialogData {
  scene: Scene;
  editable: boolean;
}

@Component({
    selector: 'koia-scene-details-dialog',
    templateUrl: './scene-details-dialog.component.html',
    styleUrls: ['./scene-details-dialog.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SceneDetailsDialogComponent extends AbstractComponent {

  readonly dataTypeLabel = EnumLabels.dataType;
  readonly isComputedColumn = isComputedColumn;
  readonly isPatternColumn = isPatternColumn;
  readonly patternColumnIcon = PATTERN_COLUMN_ICON;
  readonly computedColumnTooltip = computedColumnTooltipOf;
  readonly contextColumns = ['ctxName', 'ctxValue'];
  readonly columnColumns: string[];
  readonly scene: Scene;
  readonly editable: boolean;

  colWidthMeasurement: string;

  /**
   * number of entries processed while a pattern column is being added, undefined otherwise
   */
  processedCount: number;

  /**
   * names of the columns a pattern column is offered for, undefined while the data sample is being read
   */
  suitableColumns: Set<string>;

  constructor(public dialogRef: MatDialogRef<SceneDetailsDialogComponent>, @Inject(MAT_DIALOG_DATA) data: SceneDetailsDialogData,
    private patternColumnService: PatternColumnService, bottomSheet: MatBottomSheet, notificationService: NotificationService) {
    super(bottomSheet, notificationService);
    this.scene = data.scene;
    this.editable = data.editable;
    this.columnColumns = ['name', 'type', 'format', 'groupBy', 'width', ...(this.editable ? ['actions'] : [])];
    this.colWidthMeasurement = colWidthMeasurementToDisplay(this.scene);
    if (this.editable) {
      this.patternColumnService.suitableColumnNames(this.scene)
        .then(names => this.suitableColumns = names)
        .catch(err => this.notifyError(err));
    }
  }

  groupingTimeUnitKey(timeUnit: TimeUnit): string {
    return EnumLabelKeys.groupingTimeUnit(timeUnit);
  }

  get addingPattern(): boolean {
    return this.processedCount !== undefined;
  }

  canAddPattern(column: Column): boolean {
    return !!this.suitableColumns?.has(column.name) && canDerivePattern(column, this.scene.columns);
  }

  /**
   * adds a pattern column of the specified column, the dialog cannot be closed meanwhile
   */
  async addPattern(column: Column): Promise<void> {
    this.processedCount = 0;
    this.dialogRef.disableClose = true;
    try {
      const patternColumn = await this.patternColumnService.add(this.scene._id, column.name, count => this.processedCount = count);
      this.scene.columns = [...this.scene.columns, patternColumn];
      this.notifySuccess(LanguageService.instant('scenes.details.patternAdded', { column: patternColumn.name }));
    } catch (err) {
      this.notifyError(err);
    } finally {
      this.processedCount = undefined;
      this.dialogRef.disableClose = false;
    }
  }
}
