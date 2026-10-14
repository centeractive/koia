import { TestBed } from '@angular/core/testing';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DialogCloseButtonComponent } from './dialog-close-button.component';

describe('DialogCloseButtonComponent', () => {

  it('should close dialog when clicked', () => {

    // given
    const dialogRef = { close(): void { } };
    const closeSpy = vi.spyOn(dialogRef, 'close');
    TestBed.configureTestingModule({
      declarations: [DialogCloseButtonComponent],
      imports: [MatDialogModule, MatIconModule, MatTooltipModule],
      providers: [{ provide: MatDialogRef, useValue: dialogRef }]
    });
    const fixture = TestBed.createComponent(DialogCloseButtonComponent);
    fixture.detectChanges();
    const closeButton: HTMLButtonElement = fixture.nativeElement.querySelector('#but_close_dialog');

    // when
    closeButton.click();

    // then
    expect(closeSpy).toHaveBeenCalled();
  });
});
