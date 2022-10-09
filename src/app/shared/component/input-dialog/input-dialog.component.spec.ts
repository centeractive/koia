import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InputDialogComponent, InputDialogData } from './input-dialog.component';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';

describe('InputDialogComponent', () => {

  let dialogData: InputDialogData;
  let component: InputDialogComponent;
  let fixture: ComponentFixture<InputDialogComponent>;

  beforeEach(waitForAsync(() => {
    dialogData = new InputDialogData('Save View', 'View Name', 'abc', 10);
    TestBed.configureTestingModule({
      declarations: [InputDialogComponent],
      imports: [BrowserAnimationsModule, MatCardModule, FormsModule, MatFormFieldModule, MatButtonModule, MatInputModule],
      providers: [
        { provide: MatDialogRef, useValue: { close(): void { } } },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
      ]
    })
      .compileComponents();
  }));

  beforeEach(async () => {
    fixture = TestBed.createComponent(InputDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should create view from model', () => {
    expect(getInputValue()).toBe('abc');
  });

  it('#click on cancel button should close dialog', () => {

    // given
    const cancelButton: HTMLButtonElement = fixture.debugElement.query(By.css('#but_cancel')).nativeElement;
    spyOn(component.dialogRef, 'close');

    // when
    cancelButton.click();

    // then
    expect(component.data.closedWithOK).toBeFalsy();
    expect(component.dialogRef.close).toHaveBeenCalled();
  });

  it('#click on ok button should close dialog', () => {

    // given
    changeInputValue('test');
    const okButton: HTMLButtonElement = fixture.debugElement.query(By.css('#but_ok')).nativeElement;
    spyOn(component.dialogRef, 'close');

    // when
    okButton.click();

    // then
    expect(component.data.closedWithOK).toBeTrue();
    expect(component.data.input).toEqual('test');
    expect(component.dialogRef.close).toHaveBeenCalled();
  });

  function getInputValue(): string {
    return fixture.debugElement.query(By.css('input')).nativeElement.value;
  }

  function changeInputValue(value: string): void {
    const inputElement: HTMLInputElement = fixture.debugElement.query(By.css('input')).nativeElement;
    inputElement.value = value;
    inputElement.dispatchEvent(new Event('input'));
  }
});
