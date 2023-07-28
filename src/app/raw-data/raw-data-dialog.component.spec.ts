import { Component, Input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Operator, PropertyFilter, Query } from 'app/shared/model';
import { CouchDBConstants } from 'app/shared/services/backend/couchdb';
import { RawDataDialogComponent } from './raw-data-dialog.component';

@Component({ selector: 'koia-raw-data', template: '' })
class RawDataComponent {
   @Input() dialogStyle: boolean;
   @Input() query: Query;
   @Input() hideToolbar: boolean;
}
describe('RawDataDialogComponent', () => {

   it('should hide toolbar when data is specified by specific ID', () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter(CouchDBConstants._ID, Operator.EQUAL, '1'));

      // when
      const component = createComponent(query);

      // then
      expect(component.hideToolbar).toBeTrue();
   });

   it('should not hide toolbar when data is not specified by specific ID', () => {

      // given
      const query = new Query();
      query.addValueRangeFilter('Amount', 10, 20);

      // when
      const component = createComponent(query);

      // then
      expect(component.hideToolbar).toBeFalse();
   });

   function createComponent(query: Query): RawDataDialogComponent {
      TestBed.configureTestingModule({
         declarations: [RawDataDialogComponent, RawDataComponent],
         providers: [
            { provide: MatDialogRef, useValue: { close(): void { } } },
            { provide: MAT_DIALOG_DATA, useValue: query },
         ]
      })
         .compileComponents();
      const fixture = TestBed.createComponent(RawDataDialogComponent);
      fixture.detectChanges();
      return fixture.componentInstance;
   }
});
