import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { Route } from 'app/shared/model';
import { View } from 'app/shared/model/view-config';
import { SavedViewListComponent } from '../saved-view-list/saved-view-list.component';
import { ViewLauncherContext } from './view-launcher-context.type.';
import { ViewLauncherDialogComponent } from './view-launcher-dialog.component';

describe('ViewLauncherDialogComponent', () => {

  let dialogData: ViewLauncherContext;
  let dialogRef: { close: () => void };
  let component: ViewLauncherDialogComponent;
  let fixture: ComponentFixture<ViewLauncherDialogComponent>;

  beforeEach(waitForAsync(() => {
    dialogData = {
      views: [],
      loading: false,
      canGenerateDashboard: () => true,
      loadView: vi.fn(),
      generateDashboard: vi.fn()
    } as unknown as ViewLauncherContext;
    dialogRef = { close: vi.fn() };
    TestBed.configureTestingModule({
      declarations: [ViewLauncherDialogComponent, SavedViewListComponent],
      imports: [MatCardModule, MatButtonModule, MatIconModule],
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

  it('#click on generate button should generate dashboard and close dialog', () => {

    // given
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('#but_generate_dashboard');

    // when
    button.click();

    // then
    expect(dialogData.generateDashboard).toHaveBeenCalled();
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('generate button should be disabled when dashboard cannot be generated', () => {

    // given
    dialogData.canGenerateDashboard = () => false;

    // when
    fixture.detectChanges();

    // then
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('#but_generate_dashboard');
    expect(button.disabled).toBe(true);
  });

  it('should show loading hint while entries are loading', () => {

    // given
    dialogData.loading = true;

    // when
    fixture.detectChanges();

    // then
    const hint: HTMLElement = fixture.nativeElement.querySelector('var');
    expect(hint.textContent).toBe('Loading Data...');
  });

  it('should not show loading hint when entries are loaded', () => {

    // when
    fixture.detectChanges();

    // then
    expect(fixture.nativeElement.querySelector('var')).toBeNull();
  });

  it('#viewSelected should load view and close dialog', () => {

    // given
    const view: View = { route: Route.GRID, name: 'A', modifiedTime: 1, query: null, gridColumns: 2, gridCellRatio: '1:1', elements: [] };
    dialogData.views = [view];
    fixture.detectChanges();

    // when
    fixture.debugElement.query(By.directive(SavedViewListComponent)).triggerEventHandler('viewSelected', view);

    // then
    expect(dialogData.loadView).toHaveBeenCalledWith(view);
    expect(dialogRef.close).toHaveBeenCalled();
  });
});
