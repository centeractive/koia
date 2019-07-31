import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { ConnectionDialogComponent } from './connection-dialog.component';
import { MatButtonModule, MatFormFieldModule, MatInputModule, MatCardModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ConnectionInfo, CouchDBService } from 'app/shared/services/backend/couchdb';
import { By } from '@angular/platform-browser';

describe('ConnectionDialogComponent', () => {

  let connectionInfo: ConnectionInfo;
  let component: ConnectionDialogComponent;
  let fixture: ComponentFixture<ConnectionDialogComponent>;

  beforeEach(async(() => {
    const dialogRef = <MatDialogRef<ConnectionDialogComponent>>{
      close(): void { }
    };
    connectionInfo = <ConnectionInfo>JSON.parse(JSON.stringify(CouchDBService.DEFAULT_CONNECTION_INFO));
    TestBed.configureTestingModule({
      declarations: [ConnectionDialogComponent],
      imports: [BrowserAnimationsModule, MatCardModule, FormsModule, MatFormFieldModule, MatButtonModule, MatInputModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: connectionInfo },
      ]
    })
      .compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(ConnectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should create view from model', () => {
    expect(getInputValue('host')).toBe(connectionInfo.host);
    expect(getInputValue('port')).toBe(connectionInfo.port.toString());
    expect(getInputValue('user')).toBe(connectionInfo.user);
    expect(getInputValue('password')).toBe(connectionInfo.password);
  });

  it('#click on cancel button should leave connection unchanged and close dialog', fakeAsync(() => {

    // given
    changeInputValue('host', 'server-x');
    changeInputValue('port', '999');
    changeInputValue('user', 'abc123');
    changeInputValue('password', '%ad3Zds_');
    const cancelButton: HTMLSelectElement = fixture.debugElement.query(By.css('#but_cancel')).nativeElement;
    spyOn(component.dialogRef, 'close');

    // when
    cancelButton.click();

    // then
    expect(component.connectionInfo).toEqual(CouchDBService.DEFAULT_CONNECTION_INFO);
    expect(component.dialogRef.close).toHaveBeenCalled();
  }));

  it('#click on ok button should change connection and close dialog', fakeAsync(() => {

    // given
    changeInputValue('host', 'server-x');
    changeInputValue('port', '999');
    changeInputValue('user', 'abc123');
    changeInputValue('password', '%ad3Zds_');
    const okButton: HTMLSelectElement = fixture.debugElement.query(By.css('#but_ok')).nativeElement;
    spyOn(component.dialogRef, 'close');

    // when
    okButton.click();

    // then
    expect(component.connectionInfo.host).toBe('server-x');
    expect(component.connectionInfo.port).toBe(999);
    expect(component.connectionInfo.user).toBe('abc123');
    expect(component.connectionInfo.password).toBe('%ad3Zds_');
    expect(component.dialogRef.close).toHaveBeenCalled();
  }));

  function getInputValue(id: string): string | number {
    return fixture.debugElement.query(By.css('#' + id)).nativeElement.value;
  }

  function changeInputValue(id: string, value: string): void {
    const inputElement: HTMLInputElement = fixture.debugElement.query(By.css('#' + id)).nativeElement;
    inputElement.value = value;
    inputElement.dispatchEvent(new Event('input'));
  }

});
