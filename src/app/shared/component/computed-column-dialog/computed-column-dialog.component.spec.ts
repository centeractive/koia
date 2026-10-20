import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { KoiaFormDirective } from 'app/shared/directives/koia-form.directive';
import { Column, ComputeOperator, DataType } from 'app/shared/model';
import { ComputedColumnService } from 'app/shared/services/computed-column.service';
import { DialogService } from 'app/shared/services/dialog.service';
import { of } from 'rxjs';
import { ConfirmDialogData } from '../confirm-dialog/confirm-dialog/confirm-dialog.component';
import { ComputedColumnDialogComponent, ComputedColumnDialogData } from './computed-column-dialog.component';

describe('ComputedColumnDialogComponent', () => {

  const quantity: Column = { name: 'Quantity', dataType: DataType.NUMBER, width: 60, indexed: true };
  const revenue: Column = { name: 'Revenue', dataType: DataType.NUMBER, width: 80, indexed: true };
  const entries = [
    { Date: 1, Quantity: 'x', Revenue: 100 },
    { Date: 2, Quantity: 25, Revenue: 140 },
    { Date: 3, Quantity: 30, Revenue: 150 }
  ];

  let computedColumnService: {
    operandColumns: ReturnType<typeof vi.fn>;
    usedNames: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let dialogService: { showConfirmDialog: ReturnType<typeof vi.fn> };
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let confirmButtonIndex: number;
  let data: ComputedColumnDialogData;
  let component: ComputedColumnDialogComponent;
  let fixture: ComponentFixture<ComputedColumnDialogComponent>;

  beforeEach(() => {
    confirmButtonIndex = 0;
    computedColumnService = {
      operandColumns: vi.fn().mockReturnValue([quantity, revenue]),
      usedNames: vi.fn((exceptName?: string) => ['Date', 'Quantity', 'Revenue', 'Share', '_id'].filter(n => n !== exceptName)),
      save: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined)
    };
    dialogService = {
      showConfirmDialog: vi.fn().mockImplementation((confirmData: ConfirmDialogData) => ({
        afterClosed: () => {
          confirmData.closedWithButtonIndex = confirmButtonIndex;
          return of(undefined);
        }
      }))
    };
    dialogRef = { close: vi.fn() };
  });

  it('should suggest formula as name in create mode', () => {

    // when
    setup(new ComputedColumnDialogData(entries));

    // then
    expect(input('#input_name').value).toBe('Quantity as % of Revenue');
    expect(text('mat-card-title')).toBe('New Computed Column');
    expect(text('#span_formula')).toBe('Formula: Quantity as % of Revenue');
  });

  it('should initialize operands from operand columns of service', () => {

    // when
    setup(new ComputedColumnDialogData(entries));

    // then
    expect(component.operands).toEqual([quantity, revenue]);
    expect(component.form.getRawValue()).toEqual({
      name: 'Quantity as % of Revenue', leftColumn: 'Quantity', operator: ComputeOperator.PERCENTAGE, rightColumn: 'Revenue'
    });
  });

  it('should use first operand twice when only one operand exists', () => {

    // given
    computedColumnService.operandColumns.mockReturnValue([quantity]);

    // when
    setup(new ComputedColumnDialogData(entries));

    // then
    expect(component.form.controls.rightColumn.value).toBe('Quantity');
    expect(component.form.controls.name.value).toBe('Quantity as % of Quantity');
  });

  it('should initialize from column in edit mode', () => {

    // when
    setup(new ComputedColumnDialogData(entries, shareColumn('Share', ComputeOperator.DIVIDE)));

    // then
    expect(component.form.getRawValue()).toEqual({
      name: 'Share', leftColumn: 'Quantity', operator: ComputeOperator.DIVIDE, rightColumn: 'Revenue'
    });
    expect(text('mat-card-title')).toBe('Edit Computed Column');
    expect(computedColumnService.usedNames).toHaveBeenCalledWith('Share');
  });

  it('#onSelectionChanged should let name follow the operator', () => {

    // given
    setup(new ComputedColumnDialogData(entries));
    component.form.controls.operator.setValue(ComputeOperator.DIVIDE);

    // when
    fixture.debugElement.query(By.css('#select_operator')).triggerEventHandler('selectionChange', {});
    fixture.detectChanges();

    // then
    expect(input('#input_name').value).toBe('Quantity ÷ Revenue');
    expect(text('#span_formula')).toBe('Formula: Quantity ÷ Revenue');
  });

  it('#onSelectionChanged should let name follow the operands', () => {

    // given
    setup(new ComputedColumnDialogData(entries));
    component.form.controls.leftColumn.setValue('Revenue');
    fixture.debugElement.query(By.css('#select_left_column')).triggerEventHandler('selectionChange', {});
    component.form.controls.rightColumn.setValue('Quantity');

    // when
    fixture.debugElement.query(By.css('#select_right_column')).triggerEventHandler('selectionChange', {});

    // then
    expect(component.form.controls.name.value).toBe('Revenue as % of Quantity');
  });

  it('#onSelectionChanged should keep name once a different name was typed', () => {

    // given
    setup(new ComputedColumnDialogData(entries));
    typeName('My Share');
    component.form.controls.operator.setValue(ComputeOperator.ADD);

    // when
    component.onSelectionChanged();

    // then
    expect(component.form.controls.name.value).toBe('My Share');
    expect(component.formula).toBe('Formula: Quantity + Revenue');
  });

  it('#onSelectionChanged should let name follow in edit mode while it equals the original formula', () => {

    // given
    setup(new ComputedColumnDialogData(entries, shareColumn('Quantity as % of Revenue', ComputeOperator.PERCENTAGE)));
    component.form.controls.operator.setValue(ComputeOperator.MULTIPLY);

    // when
    component.onSelectionChanged();

    // then
    expect(component.form.controls.name.value).toBe('Quantity × Revenue');
  });

  it('#onSelectionChanged should keep name in edit mode when it differs from the original formula', () => {

    // given
    setup(new ComputedColumnDialogData(entries, shareColumn('Share', ComputeOperator.PERCENTAGE)));
    component.form.controls.operator.setValue(ComputeOperator.MULTIPLY);

    // when
    component.onSelectionChanged();

    // then
    expect(component.form.controls.name.value).toBe('Share');
  });

  it('click on swap button should swap operands', () => {

    // given
    setup(new ComputedColumnDialogData(entries));

    // when
    button('#but_swap_operands').click();
    fixture.detectChanges();

    // then
    expect(component.form.controls.leftColumn.value).toBe('Revenue');
    expect(component.form.controls.rightColumn.value).toBe('Quantity');
    expect(input('#input_name').value).toBe('Revenue as % of Quantity');
    expect(text('#span_example')).toBe('Row 2: 140 as % of 25 = 560');
  });

  it('should show example of first row with numbers in both columns', () => {

    // when
    setup(new ComputedColumnDialogData(entries));

    // then
    expect(text('#span_example')).toBe('Row 2: 25 as % of 140 = ' + (17.86).toLocaleString());
  });

  it('should show no example when no row contains numbers in both columns', () => {

    // when
    setup(new ComputedColumnDialogData([{ Quantity: 1 }]));

    // then
    expect(text('#span_example')).toBe('No example: no row contains numbers in both columns');
  });

  it.each(['Date', '_id', ' Share '])('should show name in use message when name is "%s"', name => {

    // given
    setup(new ComputedColumnDialogData(entries));

    // when
    typeName(name);
    component.form.controls.name.markAsTouched();
    fixture.detectChanges();

    // then
    expect(component.nameErrorMessage()).toBe('Name is already in use');
    expect(text('mat-error')).toBe('Name is already in use');
    expect(button('#but_ok').disabled).toBe(true);
  });

  it('OK button should be enabled when name is valid', () => {

    // when
    setup(new ComputedColumnDialogData(entries));

    // then
    expect(button('#but_ok').disabled).toBe(false);
    expect(component.nameErrorMessage()).toBe('');
  });

  it('click on OK button should save column with trimmed name and maximum width', async () => {

    // given
    setup(new ComputedColumnDialogData(entries));
    typeName('  My Share  ');

    // when
    button('#but_ok').click();
    await fixture.whenStable();

    // then
    const column: Column = {
      name: 'My Share', dataType: DataType.NUMBER, width: 80, indexed: false,
      computation: { leftColumn: 'Quantity', operator: ComputeOperator.PERCENTAGE, rightColumn: 'Revenue' }
    };
    expect(computedColumnService.save).toHaveBeenCalledWith(column, undefined);
    expect(data.savedColumn).toEqual(column);
    expect(dialogRef.close).toHaveBeenCalled();
    expect(component.saving).toBe(false);
  });

  it('#save should use name length as width when name is longer than operand widths', async () => {

    // given
    setup(new ComputedColumnDialogData(entries));
    typeName('x'.repeat(90));

    // when
    await component.save();

    // then
    expect(data.savedColumn.width).toBe(90);
  });

  it('#save should pass previous name when column was renamed', async () => {

    // given
    setup(new ComputedColumnDialogData(entries, shareColumn('Share', ComputeOperator.PERCENTAGE)));
    typeName('Quota');

    // when
    await component.save();

    // then
    expect(computedColumnService.save).toHaveBeenCalledWith(expect.objectContaining({ name: 'Quota' }), 'Share');
  });

  it('#save should keep dialog open and show error when saving failed', async () => {

    // given
    computedColumnService.save.mockRejectedValue(new Error('conflict'));
    setup(new ComputedColumnDialogData(entries));

    // when
    await component.save();
    fixture.detectChanges();

    // then
    expect(text('#error_message')).toBe('Computed column cannot be saved: conflict');
    expect(data.savedColumn).toBeUndefined();
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(component.saving).toBe(false);
    expect(button('#but_ok').disabled).toBe(false);
  });

  it('#save should show error that is no Error object', async () => {

    // given
    computedColumnService.save.mockRejectedValue('offline');
    setup(new ComputedColumnDialogData(entries));

    // when
    await component.save();

    // then
    expect(component.errorMessage).toBe('Computed column cannot be saved: offline');
  });

  it('#save should clear previous error when retried successfully', async () => {

    // given
    computedColumnService.save.mockRejectedValueOnce(new Error('conflict'));
    setup(new ComputedColumnDialogData(entries));
    await component.save();

    // when
    await component.save();

    // then
    expect(component.errorMessage).toBeUndefined();
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('delete button should not exist in create mode', () => {

    // when
    setup(new ComputedColumnDialogData(entries));

    // then
    expect(button('#but_delete')).toBeNull();
  });

  it('click on delete button should remove column and close dialog when confirmed', async () => {

    // given
    setup(new ComputedColumnDialogData(entries, shareColumn('A<B', ComputeOperator.PERCENTAGE)));

    // when
    button('#but_delete').click();
    await fixture.whenStable();

    // then
    const confirmData: ConfirmDialogData = dialogService.showConfirmDialog.mock.calls[0][0];
    expect(confirmData.title).toBe('Delete Computed Column');
    expect(confirmData.htmlContent).toBe('<p>Do you really want to delete "A&lt;B"? It will be removed from all charts and tables using it, ' +
      'in all dashboards and saved views.</p>');
    expect(computedColumnService.remove).toHaveBeenCalledWith('A<B');
    expect(dialogRef.close).toHaveBeenCalled();
    expect(data.savedColumn).toBeUndefined();
  });

  it('#delete should keep column when not confirmed', async () => {

    // given
    confirmButtonIndex = 1;
    setup(new ComputedColumnDialogData(entries, shareColumn('Share', ComputeOperator.PERCENTAGE)));

    // when
    await component.delete();

    // then
    expect(computedColumnService.remove).not.toHaveBeenCalled();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('#delete should keep dialog open and show error when removing failed', async () => {

    // given
    computedColumnService.remove.mockRejectedValue(new Error('conflict'));
    setup(new ComputedColumnDialogData(entries, shareColumn('Share', ComputeOperator.PERCENTAGE)));

    // when
    await component.delete();

    // then
    expect(component.errorMessage).toBe('Computed column cannot be deleted: conflict');
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('click on cancel button should close dialog without saving', () => {

    // given
    setup(new ComputedColumnDialogData(entries));

    // when
    button('#but_cancel').click();

    // then
    expect(dialogRef.close).toHaveBeenCalled();
    expect(computedColumnService.save).not.toHaveBeenCalled();
    expect(data.savedColumn).toBeUndefined();
  });

  it('#operatorKey should return enum label key', () => {

    // given
    setup(new ComputedColumnDialogData(entries));

    // when
    const key = component.operatorKey(ComputeOperator.SUBTRACT);

    // then
    expect(key).toBe('enum.computeOperator.SUBTRACT');
  });

  function setup(dialogData: ComputedColumnDialogData): void {
    data = dialogData;
    TestBed.configureTestingModule({
      declarations: [ComputedColumnDialogComponent, KoiaFormDirective],
      imports: [
        MatCardModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
        MatIconModule, MatTooltipModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: ComputedColumnService, useValue: computedColumnService },
        { provide: DialogService, useValue: dialogService }
      ]
    });
    fixture = TestBed.createComponent(ComputedColumnDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function shareColumn(name: string, operator: ComputeOperator): Column {
    return {
      name, dataType: DataType.NUMBER, width: 80, indexed: false,
      computation: { leftColumn: 'Quantity', operator, rightColumn: 'Revenue' }
    };
  }

  function typeName(name: string): void {
    const nameInput = input('#input_name');
    nameInput.value = name;
    nameInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function input(selector: string): HTMLInputElement {
    return fixture.nativeElement.querySelector(selector);
  }

  function button(selector: string): HTMLButtonElement {
    return fixture.nativeElement.querySelector(selector);
  }

  function text(selector: string): string {
    return fixture.nativeElement.querySelector(selector).textContent.trim();
  }
});
