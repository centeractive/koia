import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Scene } from 'app/shared/model';

@Component({
  selector: 'koia-scene-details-dialog',
  template: `<mat-card>
                <h2>{{ scene.name }}</h2>
                <h3>Source Context</h3>
                <table>
                  <tr *ngFor="let contextInfo of scene.context">
                     <th class="row-header">{{ contextInfo.name }}</th>
                     <td>{{ contextInfo.value }}</td>
                  </tr>
                </table>
                <h3>Columns</h3>
                <table>
                  <tr>
                     <th class="column-header">Name</th>
                     <th class="column-header">Type</th>
                     <th class="column-header">Format</th>                     
                     <th class="column-header">Group By</th>
                     <th class="column-header">Width</th>
                  </tr>
                  <tr *ngFor="let column of scene.columns">
                     <th class="row-header">{{ column.name }}</th>
                     <td>{{ column.dataType }}</td>
                     <td>{{ column.format }}</td>
                     <td>{{ column.groupingTimeUnit }}</td>
                     <td style="text-align: right">{{ column.width }}</td>
                  </tr>
                </table>
              </mat-card>`,
  styles: [`table {
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
            }`]
})
export class SceneDetailsDialogComponent {

  constructor(public dialogRef: MatDialogRef<SceneDetailsDialogComponent>, @Inject(MAT_DIALOG_DATA) public scene: Scene) { }
}
