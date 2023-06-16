import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Query, Operator } from 'app/shared/model';
import { CouchDBConstants } from 'app/shared/services/backend/couchdb';

@Component({
   selector: 'koia-raw-data-dialog',
   template: '<koia-raw-data [dialogStyle]="true" [hideToolbar]="hideToolbar" [query]="query"></koia-raw-data>'
})
export class RawDataDialogComponent {

   hideToolbar: boolean;

   constructor(public dialogRef: MatDialogRef<RawDataDialogComponent>, @Inject(MAT_DIALOG_DATA) public query: Query) {
      this.hideToolbar =
         !!this.query.findPropertyFilter(CouchDBConstants._ID, Operator.EQUAL) ||
         !!this.query.findPropertyFilter(CouchDBConstants._ID, Operator.ANY_OF);
   }
}
