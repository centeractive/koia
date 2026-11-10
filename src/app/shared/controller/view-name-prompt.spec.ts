import { MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { InputDialogComponent, InputDialogData } from '../component/input-dialog/input-dialog.component';
import { DialogService } from '../services/dialog.service';
import { promptViewName, VIEW_NAME_MAX_LENGTH } from './view-name-prompt';

describe('promptViewName', () => {

  let dialogService: DialogService;

  beforeEach(() => {
    dialogService = { showInputDialog: vi.fn() } as unknown as DialogService;
  });

  it('#promptViewName should resolve entered name when dialog is closed with OK', async () => {

    // given
    closeDialogWith('new name', true);

    // when
    const name = await promptViewName(dialogService, 'current');

    // then
    expect(name).toBe('new name');
    const dialogData: InputDialogData = vi.mocked(dialogService.showInputDialog).mock.lastCall[0];
    expect(dialogData.title).toBe('Save View');
    expect(dialogData.inputName).toBe('View Name');
    expect(dialogData.maxLength).toBe(VIEW_NAME_MAX_LENGTH);
  });

  it('#promptViewName should resolve undefined when dialog is canceled', async () => {

    // given
    closeDialogWith('new name', false);

    // when
    const name = await promptViewName(dialogService, 'current');

    // then
    expect(name).toBeUndefined();
  });

  it('#promptViewName should resolve entered name without surrounding whitespace', async () => {

    // given
    closeDialogWith('  Sales  ', true);

    // when
    const name = await promptViewName(dialogService, 'current');

    // then
    expect(name).toBe('Sales');
  });

  function closeDialogWith(input: string, closedWithOK: boolean): void {
    vi.mocked(dialogService.showInputDialog).mockImplementation((data: InputDialogData) => {
      data.input = input;
      data.closedWithOK = closedWithOK;
      return dialogRef();
    });
  }

  function dialogRef(): MatDialogRef<InputDialogComponent> {
    return <MatDialogRef<InputDialogComponent>>{
      afterClosed: () => of(true)
    };
  }
});
