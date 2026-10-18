import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { Route } from 'app/shared/model';
import { ConfigRecord } from 'app/shared/model/view-config';
import { SavedViewListComponent } from '../saved-view-list/saved-view-list.component';
import { ConfigLauncherContext } from './config-launcher-context.type.';
import { ConfigLauncherDialogComponent } from './config-launcher-dialog.component';

describe('ConfigLauncherDialogComponent', () => {

  let dialogData: ConfigLauncherContext;
  let component: ConfigLauncherDialogComponent;
  let fixture: ComponentFixture<ConfigLauncherDialogComponent>;

  beforeEach(waitForAsync(() => {
    dialogData = new ConfigController();
    TestBed.configureTestingModule({
      declarations: [ConfigLauncherDialogComponent, SavedViewListComponent],
      imports: [MatCardModule, MatButtonModule, MatIconModule],
      providers: [
        { provide: MatDialogRef, useValue: { close(): void { } } },
        { provide: MAT_DIALOG_DATA, useValue: dialogData }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigLauncherDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('#viewSelected should load config record and close dialog', () => {

    // given
    const configRecord: ConfigRecord = { route: Route.PIVOT, name: 'A', modifiedTime: 1, query: null, data: null };
    dialogData.configRecords = [configRecord];
    fixture.detectChanges();
    const loadConfigSpy = vi.spyOn(dialogData, 'loadConfig');
    const closeSpy = vi.spyOn(component.dialogRef, 'close');

    // when
    fixture.debugElement.query(By.directive(SavedViewListComponent)).triggerEventHandler('viewSelected', configRecord);

    // then
    expect(loadConfigSpy).toHaveBeenCalledWith(configRecord);
    expect(closeSpy).toHaveBeenCalled();
  });
});

class ConfigController implements ConfigLauncherContext {

  configRecords = [];

  // eslint-disable-next-line
  loadConfig(configRecord: ConfigRecord): void { }
}
