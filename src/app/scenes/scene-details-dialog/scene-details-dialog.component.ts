import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EnumLabels, Scene } from 'app/shared/model';
import { colWidthMeasurementToDisplay } from 'app/shared/utils/source-system';

@Component({
    selector: 'koia-scene-details-dialog',
    template: `<mat-card appearance="outlined">
                  <mat-card-content>
                    <h2>{{ scene.name }}</h2>
                    <h3>{{ 'scenes.details.sourceContext' | translate }}</h3>
                    <table>
                      @for (contextInfo of scene.context; track contextInfo) {
                        <tr>
                          <th class="row-header">{{ contextInfo.name }}</th>
                          <td>{{ contextInfo.value }}</td>
                        </tr>
                      }
                    </table>
                    <h3>{{ 'scenes.details.columns' | translate }}</h3>
                    <table>
                      <tr>
                        <th class="column-header">{{ 'scenes.details.name' | translate }}</th>
                        <th class="column-header">{{ 'scenes.details.type' | translate }}</th>
                        <th class="column-header">{{ 'scenes.details.format' | translate }}</th>
                        <th class="column-header">{{ 'scenes.details.groupBy' | translate }}</th>
                        <th class="column-header">{{ 'scenes.details.width' | translate: { unit: ('scenes.details.unit.' + colWidthMeasurement | translate) } }}</th>
                      </tr>
                      @for (column of scene.columns; track column) {
                        <tr>
                          <th class="row-header">{{ column.name }}</th>
                          <td>{{ dataTypeLabel(column.dataType) }}</td>
                          <td>{{ column.format }}</td>
                          <td>{{ column.groupingTimeUnit }}</td>
                          <td style="text-align: right">{{ column.width }}</td>
                        </tr>
                      }
                    </table>
                  </mat-card-content>
                </mat-card>
                <koia-dialog-close-button />`,
    styles: [`h2 {
              padding-right: 32px;
            }
            table {
               font-size: 12px;
            }
            .column-header {
              font-size: 14px;
              text-align: center;
              padding-right: 10px;
              white-space: nowrap;
            }
            .row-header {
              vertical-align: top;
              text-align: right;
              padding-right: 10px;
              white-space: nowrap;
            }
            td {
              padding-right: 10px;
              white-space: pre-wrap;
            }`],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SceneDetailsDialogComponent {

  readonly dataTypeLabel = EnumLabels.dataType;

  colWidthMeasurement: string;

  constructor(public dialogRef: MatDialogRef<SceneDetailsDialogComponent>, @Inject(MAT_DIALOG_DATA) public scene: Scene) {
    this.colWidthMeasurement = colWidthMeasurementToDisplay(scene);
  }

}
