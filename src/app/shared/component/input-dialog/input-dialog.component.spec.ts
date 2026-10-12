import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { By } from '@angular/platform-browser';
import { KoiaFormDirective } from '../../directives/koia-form.directive';
import { InputDialogComponent, InputDialogData } from './input-dialog.component';

describe('InputDialogComponent', () => {

  let dialogData: InputDialogData;
  let component: InputDialogComponent;
  let fixture: ComponentFixture<InputDialogComponent>;

  beforeEach(waitForAsync(() => {
    dialogData = new InputDialogData('Save View', 'View Name', 'abc', 10);
    TestBed.configureTestingModule({
      declarations: [InputDialogComponent, KoiaFormDirective],
      imports: [MatCardModule, FormsModule, MatFormFieldModule, MatButtonModule, MatInputModule],
      providers: [
        { provide: MatDialogRef, useValue: { close(): void { } } },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
      ]
    }).compileComponents();
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
    vi.spyOn(component.dialogRef, 'close').mockReturnValue(undefined);

    // when
    cancelButton.click();

    // then
    expect(component.data.closedWithOK).toBe(false);
    expect(component.dialogRef.close).toHaveBeenCalled();
  });

  it('#click on ok button should close dialog', () => {

    // given
    changeInputValue('test');
    const okButton: HTMLButtonElement = fixture.debugElement.query(By.css('#but_ok')).nativeElement;
    vi.spyOn(component.dialogRef, 'close').mockReturnValue(undefined);

    // when
    okButton.click();

    // then
    expect(component.data.closedWithOK).toBe(true);
    expect(component.data.input).toEqual('test');
    expect(component.dialogRef.close).toHaveBeenCalled();
  });

  it('input field should be outlined', () => {

    // when
    const field: HTMLElement = fixture.nativeElement.querySelector('mat-form-field');

    // then
    expect(field.classList).toContain('mat-form-field-appearance-outline');
  });

  it('cancel and ok buttons should be flat', () => {

    // when
    const cancel: HTMLElement = fixture.nativeElement.querySelector('#but_cancel');
    const ok: HTMLElement = fixture.nativeElement.querySelector('#but_ok');

    // then
    expect(cancel.classList).toContain('mat-mdc-unelevated-button');
    expect(ok.classList).toContain('mat-mdc-unelevated-button');
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
