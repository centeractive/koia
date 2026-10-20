import { MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '../component/confirm-dialog/confirm-dialog/confirm-dialog.component';
import { DialogService } from '../services/dialog.service';
import { confirmYesNo } from './confirm-prompt';

describe('confirmYesNo', () => {

  let dialogService: DialogService;

  beforeEach(() => {
    dialogService = { showConfirmDialog: vi.fn() } as unknown as DialogService;
  });

  it('#confirmYesNo should resolve true when dialog is closed with first button', async () => {

    // given
    closeWithButtonIndex(0);

    // when
    const confirmed = await confirmYesNo(dialogService, 'Title', 'Question?');

    // then
    expect(confirmed).toBe(true);
  });

  it('#confirmYesNo should resolve false when dialog is closed with second button', async () => {

    // given
    closeWithButtonIndex(1);

    // when
    const confirmed = await confirmYesNo(dialogService, 'Title', 'Question?');

    // then
    expect(confirmed).toBe(false);
  });

  it('#confirmYesNo should resolve false when dialog is closed without button', async () => {

    // given
    closeWithButtonIndex(undefined);

    // when
    const confirmed = await confirmYesNo(dialogService, 'Title', 'Question?');

    // then
    expect(confirmed).toBe(false);
  });

  it('#confirmYesNo should pass title, question wrapped in paragraph and Yes/No buttons', async () => {

    // given
    closeWithButtonIndex(0);

    // when
    await confirmYesNo(dialogService, 'Title', 'Question?');

    // then
    const data: ConfirmDialogData = vi.mocked(dialogService.showConfirmDialog).mock.lastCall[0];
    expect(data.title).toBe('Title');
    expect(data.htmlContent).toBe('<p>Question?</p>');
    expect(data.buttonNames).toEqual(['Yes', 'No']);
  });

  function closeWithButtonIndex(index: number): void {
    vi.mocked(dialogService.showConfirmDialog).mockImplementation((data: ConfirmDialogData) => {
      data.closedWithButtonIndex = index;
      return <MatDialogRef<ConfirmDialogComponent>>{ afterClosed: () => of(true) };
    });
  }
});
