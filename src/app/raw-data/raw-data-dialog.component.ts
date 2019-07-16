import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Query } from 'app/shared/model';

@Component({
   selector: 'retro-raw-data-dialog',
   template: '<retro-raw-data [query]="query"></retro-raw-data>',
})
export class RawDataDialogComponent {

   constructor(public dialogRef: MatDialogRef<RawDataDialogComponent>, @Inject(MAT_DIALOG_DATA) public query: Query) { }

   onNoClick(): void {
      this.dialogRef.close();
   }
}
