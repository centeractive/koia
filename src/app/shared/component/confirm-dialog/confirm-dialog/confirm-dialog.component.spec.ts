import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MatButtonModule, MatCardModule, MatDialogRef, MAT_DIALOG_DATA, MatCheckboxModule } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { ConfirmDialogData, ConfirmDialogComponent } from './confirm-dialog.component';
import { FormsModule } from '@angular/forms';

describe('ConfirmDialogComponent', () => {

  const title = 'Test';
  const textBlocks = ['Text Block 1', 'Text Block 2'];
  const buttonNames = ['Yes', 'No'];

  let dialogData: ConfirmDialogData;
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;

  beforeEach(async(() => {
    const dialogRef = <MatDialogRef<ConfirmDialogComponent>>{
      close(): void { }
    };
    dialogData = new ConfirmDialogData(title, textBlocks, buttonNames);
    TestBed.configureTestingModule({
      declarations: [ConfirmDialogComponent],
      imports: [BrowserAnimationsModule, MatCardModule, FormsModule, MatButtonModule, MatCheckboxModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
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
    const titleElement = fixture.debugElement.query(By.css('mat-card-subtitle')).nativeElement;

    expect(titleElement.textContent).toBe(title);
  });

  it('should create paragraphs from model', () => {
    const pDebugElements = fixture.debugElement.queryAll(By.css('p'));

    expect(pDebugElements.length).toBe(textBlocks.length);
    for (let i = 0; i < pDebugElements.length; i++) {
      const pElement: HTMLParagraphElement = pDebugElements[i].nativeElement;
      expect(pElement.innerHTML).toBe(textBlocks[i]);
    }
  });

  it('should create buttons from model', () => {
    const butDebugElements = fixture.debugElement.queryAll(By.css('button'));

    expect(butDebugElements.length).toBe(buttonNames.length);
    for (let i = 0; i < butDebugElements.length; i++) {
      const buttonElement: HTMLButtonElement = butDebugElements[i].nativeElement;
      expect(buttonElement.textContent).toBe(buttonNames[i]);
    }
  });

  it('#click on first button should close dialog', () => {

    // given
    const button: HTMLButtonElement = fixture.debugElement.queryAll(By.css('button'))[0].nativeElement;
    spyOn(component.dialogRef, 'close');

    // when
    button.click();

    // then
    expect(component.data.closedWithButtonIndex).toBe(0);
    expect(component.data.closedWithButtonName).toBe(buttonNames[0]);
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
    expect(component.data.closedWithButtonName).toBe(buttonNames[1]);
    expect(component.dialogRef.close).toHaveBeenCalled();
  });
});
