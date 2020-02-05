import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewLauncherDialogComponent } from './view-launcher-dialog.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatCardModule, MatButtonModule, MatIconModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ViewLauncherContext } from './view-launcher-context.type.';
import { View } from 'app/shared/model/view-config';
import { SummaryContext, GraphContext } from 'app/shared/model';
import { ChartContext } from 'app/shared/model/chart';

describe('ViewLauncherDialogComponent', () => {

  let dialogData: ViewLauncherContext;
  let component: ViewLauncherDialogComponent;
  let fixture: ComponentFixture<ViewLauncherDialogComponent>;

  beforeEach(async(() => {
    const dialogRef = <MatDialogRef<ViewLauncherDialogComponent>>{
      close(): void { }
    };
    dialogData = new ViewController();
    TestBed.configureTestingModule({
      declarations: [ ViewLauncherDialogComponent ],
      imports: [BrowserAnimationsModule, MatCardModule, MatButtonModule, MatIconModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
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

class ViewController implements ViewLauncherContext {
  findViews(): View[] {
    return [];
  }

  loadView(view: View): void {}

  addSummaryTable(): SummaryContext {
    return null;
  }

  addChart(): ChartContext {
    return null;
  }

  addGraph(): GraphContext {
    return null;
  }
}
