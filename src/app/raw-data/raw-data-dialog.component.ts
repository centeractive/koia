import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Operator, Query } from 'app/shared/model';
import { CouchDBConstants } from 'app/shared/services/backend/couchdb';

/**
 * data passed to the raw data dialog
 */
export interface RawDataDialogData {
   query: Query;

   /**
    * the rows the displayed rows are compared with when explaining them, absent if they cannot be explained
    */
   explainBase?: Query;
}

@Component({
   selector: 'koia-raw-data-dialog',
   template: `
      <koia-raw-data [dialogStyle]="true" [hideToolbar]="hideToolbar" [query]="query" [explainBase]="explainBase" />
      <koia-dialog-close-button />`,
   changeDetection: ChangeDetectionStrategy.Eager,
   standalone: false
})
export class RawDataDialogComponent {

   query: Query;
   explainBase: Query;
   hideToolbar: boolean;

   constructor(public dialogRef: MatDialogRef<RawDataDialogComponent>, @Inject(MAT_DIALOG_DATA) data: RawDataDialogData) {
      this.query = data.query;
      this.explainBase = data.explainBase;
      this.hideToolbar =
         !!this.query.findPropertyFilter(CouchDBConstants._ID, Operator.EQUAL) ||
         !!this.query.findPropertyFilter(CouchDBConstants._ID, Operator.ANY_OF);
   }
}
