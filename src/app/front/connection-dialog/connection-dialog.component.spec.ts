import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOption } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { KoiaFormDirective } from 'app/shared/directives/koia-form.directive';
import { ConnectionInfo, Protocol } from 'app/shared/model';
import { CouchDBConfig } from 'app/shared/services/backend/couchdb/couchdb-config';
import { ConnectionDialogComponent, ConnectionDialogData } from './connection-dialog.component';

describe('ConnectionDialogComponent', () => {

  const connectionInfo: ConnectionInfo = { protocol: Protocol.HTTP, host: 'localhost', port: 5984, user: 'admin', password: 'admin' };

  let dialogData: ConnectionDialogData;
  let component: ConnectionDialogComponent;
  let fixture: ComponentFixture<ConnectionDialogComponent>;

  beforeEach(waitForAsync(() => {
    dialogData = new ConnectionDialogData(connectionInfo);
    TestBed.configureTestingModule({
      declarations: [ConnectionDialogComponent, KoiaFormDirective],
      imports: [MatCardModule, MatCheckboxModule, FormsModule, MatFormFieldModule, MatSelectModule, MatButtonModule, MatInputModule],
      providers: [
        { provide: MatDialogRef, useValue: { close(): void { } } },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
      ]
    })
      .compileComponents();
  }));

  beforeEach(waitForAsync(() => {
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

  it('#selectionChange of protocol should define default port', () => {

    // given
    const select = fixture.debugElement.query(By.css('#protocol'));

    // when
    select.triggerEventHandler('selectionChange', { value: Protocol.HTTPS });

    // then
    expect(component.data.connectionInfo.port).toBe(CouchDBConfig.DEFAULT_HTTPS_PORT);
  });

  it('#click on cancel button should close dialog', () => {

    // given
    changeInputValue('host', 'server-x');
    changeInputValue('port', '999');
    changeInputValue('user', 'abc123');
    changeInputValue('password', '%ad3Zds_');
    const cancelButton: HTMLButtonElement = fixture.debugElement.query(By.css('#but_cancel')).nativeElement;
    vi.spyOn(component.dialogRef, 'close').mockReturnValue(undefined);

    // when
    cancelButton.click();

    // then
    expect(component.data.closedWithOK).toBe(false);
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
    vi.spyOn(component.dialogRef, 'close').mockReturnValue(undefined);

    // when
    okButton.click();

    // then
    expect(component.data.closedWithOK).toBe(true);
    expect(component.data.connectionInfo.host).toBe('server-x');
    expect(component.data.connectionInfo.port).toBe(999);
    expect(component.data.connectionInfo.user).toBe('abc123');
    expect(component.data.connectionInfo.password).toBe('%ad3Zds_');
    expect(component.dialogRef.close).toHaveBeenCalled();
  });

  it('should hide remember password for local host', () => {
    expect(rememberPasswordInput()).toBeNull();
    expect(fixture.nativeElement.querySelector('.risk_note')).toBeNull();
  });

  it('should show unchecked remember password with risk note for remote host', async () => {

    // when
    await changeHost('couch.example.com');

    // then
    expect(rememberPasswordInput().checked).toBe(false);
    expect(fixture.nativeElement.querySelector('.risk_note').textContent.trim())
      .toBe('The password is stored unencrypted and can be read by anyone using this browser profile.');
  });

  it('should set remember password when checked', async () => {

    // given
    await changeHost('couch.example.com');

    // when
    rememberPasswordInput().click();
    fixture.detectChanges();
    await fixture.whenStable();

    // then
    expect(component.data.connectionInfo.rememberPassword).toBe(true);
  });

  it('should restore remember password on cancel', async () => {

    // given
    await changeHost('couch.example.com');
    rememberPasswordInput().click();
    fixture.detectChanges();
    await fixture.whenStable();

    // when
    component.onCancel();

    // then
    expect(component.data.connectionInfo).toEqual(connectionInfo);
  });

  it('form fields should be outlined', () => {

    // when
    const fields: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('mat-form-field'));

    // then
    expect(fields.length).toBe(5);
    fields.forEach(f => expect(f.classList).toContain('mat-form-field-appearance-outline'));
  });

  it('host and port should share a field row', () => {

    // given
    widenFixture();

    // when
    const host = fieldOf('host');
    const port = fieldOf('port');

    // then
    expect(host.parentElement.classList).toContain('field-row');
    expect(port.parentElement).toBe(host.parentElement);
    expect(port.getBoundingClientRect().top).toBe(host.getBoundingClientRect().top);
  });

  it('user and password should share a field row', () => {

    // given
    widenFixture();

    // when
    const user = fieldOf('user');
    const password = fieldOf('password');

    // then
    expect(user.parentElement.classList).toContain('field-row');
    expect(password.parentElement).toBe(user.parentElement);
    expect(password.getBoundingClientRect().top).toBe(user.getBoundingClientRect().top);
  });

  it('cancel and ok buttons should be flat and separated by gap', () => {

    // given
    widenFixture();

    // when
    const cancel: HTMLElement = fixture.nativeElement.querySelector('#but_cancel');
    const ok: HTMLElement = fixture.nativeElement.querySelector('#but_ok');

    // then
    expect(cancel.classList).toContain('mat-mdc-unelevated-button');
    expect(ok.classList).toContain('mat-mdc-unelevated-button');
    expect(ok.getBoundingClientRect().left - cancel.getBoundingClientRect().right).toBeCloseTo(16, 0);
  });

  function widenFixture(): void {
    fixture.nativeElement.style.display = 'block';
    fixture.nativeElement.style.width = '800px';
  }

  function fieldOf(inputId: string): HTMLElement {
    return fixture.nativeElement.querySelector('#' + inputId).closest('mat-form-field');
  }

  function getSelectedProtocol(): Protocol {
    const matSelect: MatSelect = fixture.debugElement.query(By.css('#protocol')).componentInstance;
    const selectedOption = matSelect.selected as MatOption;
    return selectedOption.value;
  }

  function getInputValue(id: string): string | number {
    return fixture.debugElement.query(By.css('#' + id)).nativeElement.value;
  }

  async function changeHost(host: string): Promise<void> {
    changeInputValue('host', host);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function rememberPasswordInput(): HTMLInputElement | null {
    return fixture.nativeElement.querySelector('#remember_password input');
  }

  function changeInputValue(id: string, value: string): void {
    const inputElement: HTMLInputElement = fixture.debugElement.query(By.css('#' + id)).nativeElement;
    inputElement.value = value;
    inputElement.dispatchEvent(new Event('input'));
  }

});
