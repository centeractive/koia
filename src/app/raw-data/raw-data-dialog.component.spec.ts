import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Operator, PropertyFilter, Query } from 'app/shared/model';
import { CouchDBConstants } from 'app/shared/services/backend/couchdb';
import { DialogCloseButtonComponent } from 'app/shared/ui/dialog-close-button/dialog-close-button.component';
import { RawDataDialogComponent } from './raw-data-dialog.component';

@Component({
    selector: 'koia-raw-data', template: '',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
class RawDataComponent {
   @Input() dialogStyle: boolean;
   @Input() query: Query;
   @Input() hideToolbar: boolean;
   @Input() explainBase: Query;
}
describe('RawDataDialogComponent', () => {

   it('should hide toolbar when data is specified by specific ID', () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter(CouchDBConstants._ID, Operator.EQUAL, '1'));

      // when
      const component = createComponent(query);

      // then
      expect(component.hideToolbar).toBe(true);
   });

   it('should not hide toolbar when data is not specified by specific ID', () => {

      // given
      const query = new Query();
      query.addValueRangeFilter('Amount', 10, 20);

      // when
      const component = createComponent(query);

      // then
      expect(component.hideToolbar).toBe(false);
   });

   it('should pass query and explanation base to raw data component', () => {

      // given
      const query = new Query(new PropertyFilter('Level', Operator.EQUAL, 'ERROR'));
      const explainBase = new Query();

      // when
      createComponent(query, explainBase);

      // then
      const rawData: RawDataComponent = fixture.debugElement.query(By.directive(RawDataComponent)).componentInstance;
      expect(rawData.dialogStyle).toBe(true);
      expect(rawData.query).toBe(query);
      expect(rawData.explainBase).toBe(explainBase);
   });

   it('should pass no explanation base to raw data component when there is none', () => {

      // when
      createComponent(new Query());

      // then
      const rawData: RawDataComponent = fixture.debugElement.query(By.directive(RawDataComponent)).componentInstance;
      expect(rawData.explainBase).toBeUndefined();
   });

   let fixture: ComponentFixture<RawDataDialogComponent>;

   function createComponent(query: Query, explainBase?: Query): RawDataDialogComponent {
      TestBed.configureTestingModule({
         declarations: [RawDataDialogComponent, RawDataComponent, DialogCloseButtonComponent],
         imports: [MatDialogModule, MatIconModule, MatTooltipModule],
         providers: [
            { provide: MatDialogRef, useValue: { close(): void { } } },
            { provide: MAT_DIALOG_DATA, useValue: { query, explainBase } },
         ]
      }).compileComponents();
      fixture = TestBed.createComponent(RawDataDialogComponent);
      fixture.detectChanges();
      return fixture.componentInstance;
   }
});
