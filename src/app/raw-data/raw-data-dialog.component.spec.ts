import { TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RawDataDialogComponent } from './raw-data-dialog.component';
import { Query, PropertyFilter, Operator } from 'app/shared/model';
import { Component, Input } from '@angular/core';
import { CouchDBConstants } from 'app/shared/services/backend/couchdb';

@Component({ selector: 'koia-raw-data', template: '' })
class RawDataComponent {
   @Input() dialogStyle: boolean;
   @Input() query: Query;
   @Input() hideToolbar: boolean;
}

describe('RawDataDialogComponent', () => {

   const dialogRef = <MatDialogRef<RawDataDialogComponent>>{
      close(): void { }
   };

   it('should hide toolbar when data is specified by specific ID', () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter(CouchDBConstants._ID, Operator.EQUAL, '1'));

      // when
      const component = createComponent(query);

      // then
      expect(component.hideToolbar).toBeTruthy();
   });

   it('should not hide toolbar when data is not specified by specific ID', () => {

      // given
      const query = new Query();
      query.addValueRangeFilter('Amount', 10, 20);

      // when
      const component = createComponent(query);

      // then
      expect(component.hideToolbar).toBeFalsy();
   });

   function createComponent(query: Query): RawDataDialogComponent {
      TestBed.configureTestingModule({
         declarations: [RawDataDialogComponent, RawDataComponent],
         providers: [
            { provide: MatDialogRef, useValue: dialogRef },
            { provide: MAT_DIALOG_DATA, useValue: query },
         ]
      })
         .compileComponents();
      const fixture = TestBed.createComponent(RawDataDialogComponent);
      fixture.detectChanges();
      return fixture.componentInstance;
   }
});
