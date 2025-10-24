import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ViewLauncherContext } from './view-launcher-context.type.';
import { ViewLauncherDialogComponent } from './view-launcher-dialog.component';

describe('ViewLauncherDialogComponent', () => {

  let dialogData: ViewLauncherContext;
  let component: ViewLauncherDialogComponent;
  let fixture: ComponentFixture<ViewLauncherDialogComponent>;

  beforeEach(waitForAsync(() => {
    dialogData = {} as ViewLauncherContext;
    TestBed.configureTestingModule({
      declarations: [ViewLauncherDialogComponent],
      imports: [MatCardModule, MatButtonModule, MatIconModule],
      providers: [
        { provide: MatDialogRef, useValue: { close(): void { } } },
        { provide: MAT_DIALOG_DATA, useValue: dialogData }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewLauncherDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
