import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { ConfirmDialogData, ConfirmDialogComponent } from './confirm-dialog.component';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';

describe('ConfirmDialogComponent', () => {

  const title = 'Test';
  const textBlock = '<p>Text Block</p>';

  let dialogData: ConfirmDialogData;
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;

  beforeEach(waitForAsync(() => {
    dialogData = new ConfirmDialogData(title, textBlock, ConfirmDialogData.YES_NO);
    TestBed.configureTestingModule({
      declarations: [ConfirmDialogComponent],
      imports: [BrowserAnimationsModule, MatCardModule, FormsModule, MatButtonModule, MatCheckboxModule],
      providers: [
        { provide: MatDialogRef, useValue: { close(): void { } } },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
      ]
    })
      .compileComponents();
  }));

  beforeEach(async () => {
    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should create title from model', () => {
    const titleElement = fixture.debugElement.query(By.css('mat-card-title')).nativeElement;

    expect(titleElement.textContent).toBe(title);
  });

  it('should create buttons from model', () => {
    const butDebugElements = fixture.debugElement.queryAll(By.css('button'));

    expect(butDebugElements.length).toBe(ConfirmDialogData.YES_NO.length);
    for (let i = 0; i < butDebugElements.length; i++) {
      const buttonElement: HTMLButtonElement = butDebugElements[i].nativeElement;
      expect(buttonElement.textContent).toBe(ConfirmDialogData.YES_NO[i]);
    }
  });

  it('should define remember choice label when dialog contains multiple buttons', () => {
    expect(component.rememberChoiceLabel).toBe('Remember choice');
  });

  it('should define remember choice label when dialog contains single button', () => {

    // given
    TestBed.resetTestingModule();
    dialogData = new ConfirmDialogData(title, textBlock, ['OK']);
    TestBed.configureTestingModule({
      declarations: [ConfirmDialogComponent],
      imports: [BrowserAnimationsModule, MatCardModule, FormsModule, MatButtonModule, MatCheckboxModule],
      providers: [
        { provide: MatDialogRef, useValue: { close(): void { } } },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
      ]
    })
      .compileComponents();

    // when
    fixture = TestBed.createComponent(ConfirmDialogComponent);

    // then
    expect(fixture.componentInstance.rememberChoiceLabel).toBe('Don\'t show again');
  });

  it('#click on first button should close dialog', () => {

    // given
    const button: HTMLButtonElement = fixture.debugElement.queryAll(By.css('button'))[0].nativeElement;
    spyOn(component.dialogRef, 'close');

    // when
    button.click();

    // then
    expect(component.data.closedWithButtonIndex).toBe(0);
    expect(component.data.closedWithButtonName).toBe(ConfirmDialogData.YES_NO[0]);
    expect(component.dialogRef.close).toHaveBeenCalled();
  });

  it('#click on second button should close dialog', () => {

    // given
    const button: HTMLButtonElement = fixture.debugElement.queryAll(By.css('button'))[1].nativeElement;
    spyOn(component.dialogRef, 'close');

    // when
    button.click();

    // then
    expect(component.data.closedWithButtonIndex).toBe(1);
    expect(component.data.closedWithButtonName).toBe(ConfirmDialogData.YES_NO[1]);
    expect(component.dialogRef.close).toHaveBeenCalled();
  });
});
