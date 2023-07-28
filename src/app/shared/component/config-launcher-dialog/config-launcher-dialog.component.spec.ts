import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ConfigRecord } from 'app/shared/model/view-config';
import { ConfigLauncherContext } from './config-launcher-context.type.';
import { ConfigLauncherDialogComponent } from './config-launcher-dialog.component';

describe('ConfigLauncherDialogComponent', () => {

  let dialogData: ConfigLauncherContext;
  let component: ConfigLauncherDialogComponent;
  let fixture: ComponentFixture<ConfigLauncherDialogComponent>;

  beforeEach(waitForAsync(() => {
    dialogData = new ConfigController();
    TestBed.configureTestingModule({
      declarations: [ConfigLauncherDialogComponent],
      imports: [BrowserAnimationsModule, MatCardModule, MatButtonModule, MatIconModule],
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
});

class ConfigController implements ConfigLauncherContext {

  configRecords = [];

  // eslint-disable-next-line
  loadConfig(configRecord: ConfigRecord): void { }
}
