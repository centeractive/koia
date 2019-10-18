import { async, ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';

import { ConnectionDialogComponent, ConnectionDialogData } from './connection-dialog.component';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule, MatCardModule, MatDialogRef, MAT_DIALOG_DATA,
  MatSelectModule, MatSelect, MatOption
} from '@angular/material';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { Protocol, ConnectionInfo } from 'app/shared/model';
import { CouchDBConfig } from 'app/shared/services/backend/couchdb/couchdb-config';

describe('ConnectionDialogComponent', () => {

  const connectionInfo: ConnectionInfo = { protocol: Protocol.HTTP, host: 'localhost', port: 5984, user: 'admin', password: 'admin' };

  let dialogData: ConnectionDialogData;
  let component: ConnectionDialogComponent;
  let fixture: ComponentFixture<ConnectionDialogComponent>;

  beforeEach(async(() => {
    const dialogRef = <MatDialogRef<ConnectionDialogComponent>>{
      close(): void { }
    };
    dialogData = new ConnectionDialogData(connectionInfo);
    TestBed.configureTestingModule({
      declarations: [ConnectionDialogComponent],
      imports: [BrowserAnimationsModule, MatCardModule, FormsModule, MatFormFieldModule, MatSelectModule, MatButtonModule, MatInputModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
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
    expect(getSelectedProtocol()).toBe(connectionInfo.protocol);
    expect(getInputValue('host')).toBe(connectionInfo.host);
    expect(getInputValue('port')).toBe(connectionInfo.port.toString());
    expect(getInputValue('user')).toBe(connectionInfo.user);
    expect(getInputValue('password')).toBe(connectionInfo.password);
  });

  it('#onProtocolChanged should update connection info with HTTP default port', () => {

    // when
    component.onProtocolChanged(Protocol.HTTP);

    // then
    expect(component.data.connectionInfo.port).toBe(CouchDBConfig.DEFAULT_HTTP_PORT);
  });

  it('#onProtocolChanged should update connection info with HTTPS default port', () => {

    // when
    component.onProtocolChanged(Protocol.HTTPS);

    // then
    expect(component.data.connectionInfo.port).toBe(CouchDBConfig.DEFAULT_HTTPS_PORT);
  });

  it('#click on cancel button should close dialog', () => {

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
    expect(component.data.closedWithOK).toBeFalsy();
    expect(component.data.connectionInfo).toEqual(connectionInfo);
    expect(component.dialogRef.close).toHaveBeenCalled();
  });

  it('#click on ok button should change connection and close dialog', () => {

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
    expect(component.data.closedWithOK).toBeTruthy();
    expect(component.data.connectionInfo.host).toBe('server-x');
    expect(component.data.connectionInfo.port).toBe(999);
    expect(component.data.connectionInfo.user).toBe('abc123');
    expect(component.data.connectionInfo.password).toBe('%ad3Zds_');
    expect(component.dialogRef.close).toHaveBeenCalled();
  });

  function getSelectedProtocol(): Protocol {
    const matSelect: MatSelect = fixture.debugElement.query(By.css('#protocol')).componentInstance;
    const selectedOption = <MatOption>matSelect.selected;
    return selectedOption.value;
  }

  function getInputValue(id: string): string | number {
    return fixture.debugElement.query(By.css('#' + id)).nativeElement.value;
  }

  function changeInputValue(id: string, value: string): void {
    const inputElement: HTMLInputElement = fixture.debugElement.query(By.css('#' + id)).nativeElement;
    inputElement.value = value;
    inputElement.dispatchEvent(new Event('input'));
  }

});
