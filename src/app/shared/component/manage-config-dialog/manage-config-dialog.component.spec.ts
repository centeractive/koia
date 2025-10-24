import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ManageConfigContext } from './manage-config-context.type.';
import { ManageConfigDialogComponent } from './manage-config-dialog.component';

describe('ManageConfigDialogComponent', () => {

  let dialogData: ManageConfigContext;
  let component: ManageConfigDialogComponent;
  let fixture: ComponentFixture<ManageConfigDialogComponent>;

  beforeEach(waitForAsync(() => {
    dialogData = {
      configRecords: [],
      updateConfigRecords: () => null
    };
    TestBed.configureTestingModule({
      declarations: [ManageConfigDialogComponent],
      imports: [MatCardModule, MatButtonModule, MatIconModule],
      providers: [
        { provide: MatDialogRef, useValue: { close(): void { } } },
        { provide: MAT_DIALOG_DATA, useValue: dialogData }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageConfigDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
