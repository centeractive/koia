import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ManageViewContext } from './manage-view-context.type.';
import { ManageViewDialogComponent } from './manage-view-dialog.component';

describe('ManageViewDialogComponent', () => {

  let dialogData: ManageViewContext;
  let component: ManageViewDialogComponent;
  let fixture: ComponentFixture<ManageViewDialogComponent>;

  beforeEach(waitForAsync(() => {
    dialogData = {} as ManageViewContext;
    TestBed.configureTestingModule({
      declarations: [ManageViewDialogComponent],
      imports: [MatCardModule, MatButtonModule, MatIconModule],
      providers: [
        { provide: MatDialogRef, useValue: { close(): void { } } },
        { provide: MAT_DIALOG_DATA, useValue: dialogData }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageViewDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
