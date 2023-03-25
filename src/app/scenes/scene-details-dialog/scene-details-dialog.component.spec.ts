import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { DataType, Scene } from 'app/shared/model';
import { SceneFactory } from 'app/shared/test';
import { SceneDetailsDialogComponent } from './scene-details-dialog.component';
import { MatCardModule } from '@angular/material/card';

describe('SceneDetailsDialogComponent', () => {

   let scene: Scene;
   let component: SceneDetailsDialogComponent;
   let fixture: ComponentFixture<SceneDetailsDialogComponent>;

   beforeAll(() => {
      const columns = [
         { name: 'Level', dataType: DataType.TEXT, width: 60, indexed: true },
         { name: 'Path', dataType: DataType.TEXT, width: 200, indexed: true },
         { name: 'Amount', dataType: DataType.NUMBER, width: 70, indexed: true }
      ];
      scene = SceneFactory.createScene('1', columns);
   });

   beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
         declarations: [SceneDetailsDialogComponent],
         imports: [MatCardModule],
         providers: [
            { provide: MatDialogRef, useValue: { close(): void { } } },
            { provide: MAT_DIALOG_DATA, useValue: scene },
         ]
      })
         .compileComponents();
      fixture = TestBed.createComponent(SceneDetailsDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
   }));

   it('should create', () => {
      expect(component).toBeTruthy();
   });

   it('#should set header', () => {
      const headerElement = fixture.debugElement.query(By.css('h2')).nativeElement;
      expect(headerElement.textContent).toBe(scene.name);
   });
});
