import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { Column, ComputeOperator, DataType } from 'app/shared/model';
import { ComputedColumnService } from 'app/shared/services/computed-column.service';
import { DialogService } from 'app/shared/services/dialog.service';
import { of } from 'rxjs';
import { ComputedColumnDialogData } from '../computed-column-dialog/computed-column-dialog.component';
import { ComputedColumnLauncherComponent } from './computed-column-launcher.component';

describe('ComputedColumnLauncherComponent', () => {

  const amount: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 70, indexed: true };
  const share: Column = {
    name: 'Share', dataType: DataType.NUMBER, width: 70, indexed: false,
    computation: { leftColumn: 'Amount', operator: ComputeOperator.PERCENTAGE, rightColumn: 'Amount' }
  };

  let computedColumnService: { operandColumns: ReturnType<typeof vi.fn> };
  let dialogService: { showComputedColumnDialog: ReturnType<typeof vi.fn> };
  let dialogData: ComputedColumnDialogData;
  let savedColumn: Column;
  let component: ComputedColumnLauncherComponent;
  let fixture: ComponentFixture<ComputedColumnLauncherComponent>;

  beforeEach(() => {
    savedColumn = undefined;
    computedColumnService = { operandColumns: vi.fn().mockReturnValue([amount]) };
    dialogService = {
      showComputedColumnDialog: vi.fn().mockImplementation((data: ComputedColumnDialogData) => {
        dialogData = data;
        return { afterClosed: () => { data.savedColumn = savedColumn; return of(undefined); } };
      })
    };
    TestBed.configureTestingModule({
      declarations: [ComputedColumnLauncherComponent],
      imports: [MatButtonModule, MatIconModule, MatTooltipModule],
      providers: [
        { provide: ComputedColumnService, useValue: computedColumnService },
        { provide: DialogService, useValue: dialogService }
      ]
    });
    fixture = TestBed.createComponent(ComputedColumnLauncherComponent);
    component = fixture.componentInstance;
  });

  it('create button should be enabled when operand columns exist', () => {

    // when
    fixture.detectChanges();

    // then
    const button = createButton();
    expect(button.disabled).toBe(false);
    expect(button.textContent.trim()).toBe('functions Computed Column');
    expect(fixture.debugElement.query(By.css('.but_create_computed_column')).injector.get(MatTooltip).message)
      .toBe('Create a column computed from two number columns, e.g. a percentage');
  });

  it('create button should be disabled when no operand column exists', () => {

    // given
    computedColumnService.operandColumns.mockReturnValue([]);

    // when
    fixture.detectChanges();

    // then
    expect(createButton().disabled).toBe(true);
  });

  it('edit button should be shown when column is defined', () => {

    // given
    component.column = share;

    // when
    fixture.detectChanges();

    // then
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.but_edit_computed_column');
    expect(button.getAttribute('aria-label')).toBe('Edit computed column Share');
    expect(button.textContent.trim()).toBe('edit');
    expect(createButton()).toBeNull();
  });

  it('#openDialog should open dialog with entries and column', async () => {

    // given
    const entries = [{ Amount: 1 }];
    component.entries = entries;
    component.column = share;

    // when
    await component.openDialog();

    // then
    expect(dialogData.entries).toBe(entries);
    expect(dialogData.column).toBe(share);
  });

  it('#openDialog should open dialog with empty entries when entries are undefined', async () => {

    // when
    await component.openDialog();

    // then
    expect(dialogData.entries).toEqual([]);
    expect(dialogData.column).toBeUndefined();
  });

  it('#openDialog should emit saved column', async () => {

    // given
    savedColumn = share;
    const emitted: Column[] = [];
    component.columnSaved.subscribe(c => emitted.push(c));

    // when
    await component.openDialog();

    // then
    expect(emitted).toEqual([share]);
  });

  it('#openDialog should emit nothing when dialog was cancelled or column deleted', async () => {

    // given
    component.column = share;
    const emitted: Column[] = [];
    component.columnSaved.subscribe(c => emitted.push(c));

    // when
    await component.openDialog();

    // then
    expect(emitted).toEqual([]);
  });

  it('click on create button should open dialog', () => {

    // given
    fixture.detectChanges();

    // when
    createButton().click();

    // then
    expect(dialogService.showComputedColumnDialog).toHaveBeenCalled();
  });

  it('click on edit button should open dialog', () => {

    // given
    component.column = share;
    fixture.detectChanges();

    // when
    fixture.nativeElement.querySelector('.but_edit_computed_column').click();

    // then
    expect(dialogData.column).toBe(share);
  });

  function createButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.but_create_computed_column');
  }
});
