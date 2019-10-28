import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Scene } from 'app/shared/model';

@Component({
   selector: 'koia-scene-details-dialog',
   template: `<mat-card>
                <h2>{{ scene.name }}</h2>
                <h3>Source Context</h3>
                <table>
                  <tr *ngFor="let contextInfo of scene.context">
                     <th>{{ contextInfo.name }}</th>
                     <td>{{ contextInfo.value }}</td>
                  </tr>
                </table>
                <h3>Columns</h3>
                <table>
                  <tr *ngFor="let column of scene.columns">
                     <th>{{ column.name }}</th>
                     <td>{{ column.dataType + ' (' + column.width + ')' }}</td>
                  </tr>
                </table>
              </mat-card>`,
   styles: [`table {
               font-size: 12px;
             }
             th {
               vertical-align: top;
               text-align: right;
               padding-right: 10px;
               white-space: nowrap;
             }
             td {
               white-space: pre-wrap;
             }`]
})
export class SceneDetailsDialogComponent {

   constructor(public dialogRef: MatDialogRef<SceneDetailsDialogComponent>, @Inject(MAT_DIALOG_DATA) public scene: Scene) { }
}
