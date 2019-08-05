import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { ConnectionDialogComponent, ConnectionDialogData } from './connection-dialog.component';
import { MatButtonModule, MatFormFieldModule, MatInputModule, MatCardModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CouchDBService } from 'app/shared/services/backend/couchdb';
import { By } from '@angular/platform-browser';

describe('ConnectionDialogComponent', () => {

  let dialogData: ConnectionDialogData;
  let component: ConnectionDialogComponent;
  let fixture: ComponentFixture<ConnectionDialogComponent>;

  beforeEach(async(() => {
    const dialogRef = <MatDialogRef<ConnectionDialogComponent>>{
      close(): void { }
    };
    dialogData = new ConnectionDialogData(CouchDBService.DEFAULT_CONNECTION_INFO);
    TestBed.configureTestingModule({
      declarations: [ConnectionDialogComponent],
      imports: [BrowserAnimationsModule, MatCardModule, FormsModule, MatFormFieldModule, MatButtonModule, MatInputModule],
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
    const connInfo = CouchDBService.DEFAULT_CONNECTION_INFO;
    expect(getInputValue('host')).toBe(connInfo.host);
    expect(getInputValue('port')).toBe(connInfo.port.toString());
    expect(getInputValue('user')).toBe(connInfo.user);
    expect(getInputValue('password')).toBe(connInfo.password);
  });

  it('#click on cancel button should close dialog', fakeAsync(() => {

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
    expect(component.data.connectionInfo).toEqual(CouchDBService.DEFAULT_CONNECTION_INFO);
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
    expect(component.data.closedWithOK).toBeTruthy();
    expect(component.data.connectionInfo.host).toBe('server-x');
    expect(component.data.connectionInfo.port).toBe(999);
    expect(component.data.connectionInfo.user).toBe('abc123');
    expect(component.data.connectionInfo.password).toBe('%ad3Zds_');
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
