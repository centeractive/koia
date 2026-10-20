import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EnumLabels, Scene, TimeUnit } from 'app/shared/model';
import { EnumLabelKeys } from 'app/shared/model/enum-label-keys';
import { isComputedColumn } from 'app/shared/utils/column-utils';
import { computedColumnTooltipOf } from 'app/shared/utils/computation-utils';
import { colWidthMeasurementToDisplay } from 'app/shared/utils/source-system';

@Component({
    selector: 'koia-scene-details-dialog',
    templateUrl: './scene-details-dialog.component.html',
    styleUrls: ['./scene-details-dialog.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SceneDetailsDialogComponent {

  readonly dataTypeLabel = EnumLabels.dataType;
  readonly isComputedColumn = isComputedColumn;
  readonly computedColumnTooltip = computedColumnTooltipOf;
  readonly contextColumns = ['ctxName', 'ctxValue'];
  readonly columnColumns = ['name', 'type', 'format', 'groupBy', 'width'];

  colWidthMeasurement: string;

  constructor(public dialogRef: MatDialogRef<SceneDetailsDialogComponent>, @Inject(MAT_DIALOG_DATA) public scene: Scene) {
    this.colWidthMeasurement = colWidthMeasurementToDisplay(scene);
  }

  groupingTimeUnitKey(timeUnit: TimeUnit): string {
    return EnumLabelKeys.groupingTimeUnit(timeUnit);
  }

}
