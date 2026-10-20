import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { confirmYesNo } from 'app/shared/controller/confirm-prompt';
import { NumberFormatter } from 'app/shared/format';
import { Column, Computation, ComputeOperator, DataType, EnumLabels } from 'app/shared/model';
import { ComputedColumnService } from 'app/shared/services/computed-column.service';
import { DialogService } from 'app/shared/services/dialog.service';
import { LanguageService } from 'app/shared/services/language/language.service';
import { computeValue, formulaOf } from 'app/shared/utils/computation-utils';
import { availableColumnNameValidator, columnNameErrorMessage, columnNameValidators } from 'app/shared/validator/column-name-validation';
import * as _ from 'lodash';

export class ComputedColumnDialogData {

  savedColumn: Column;

  constructor(public entries: object[], public column?: Column) { }
}

@Component({
  selector: 'koia-computed-column-dialog',
  templateUrl: './computed-column-dialog.component.html',
  styleUrls: ['./computed-column-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class ComputedColumnDialogComponent {

  readonly operators = Object.values(ComputeOperator);
  readonly operands: Column[];
  readonly form: FormGroup<{
    name: FormControl<string>;
    leftColumn: FormControl<string>;
    operator: FormControl<ComputeOperator>;
    rightColumn: FormControl<string>;
  }>;

  formula: string;
  example: string;
  errorMessage: string;
  saving = false;

  private suggestedName: string;
  private numberFormatter = new NumberFormatter();

  constructor(private dialogRef: MatDialogRef<ComputedColumnDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: ComputedColumnDialogData,
    private computedColumnService: ComputedColumnService, private dialogService: DialogService) {
    this.operands = computedColumnService.operandColumns();
    const computation = data.column?.computation ?? {
      leftColumn: this.operands[0].name,
      operator: ComputeOperator.PERCENTAGE,
      rightColumn: (this.operands[1] ?? this.operands[0]).name
    };
    this.suggestedName = formulaOf(computation);
    this.form = new FormGroup({
      name: new FormControl(data.column?.name ?? this.suggestedName, {
        nonNullable: true,
        validators: [...columnNameValidators(), availableColumnNameValidator(computedColumnService.usedNames(data.column?.name))]
      }),
      leftColumn: new FormControl(computation.leftColumn, { nonNullable: true }),
      operator: new FormControl(computation.operator, { nonNullable: true }),
      rightColumn: new FormControl(computation.rightColumn, { nonNullable: true })
    });
    this.refreshPreview();
  }

  get titleKey(): string {
    return this.data.column ? 'computedColumn.editTitle' : 'computedColumn.createTitle';
  }

  operatorKey(operator: ComputeOperator): string {
    return EnumLabels.computeOperatorKey(operator);
  }

  onSelectionChanged(): void {
    const formula = formulaOf(this.computation());
    if (this.form.controls.name.value === this.suggestedName) {
      this.form.controls.name.setValue(formula, { emitEvent: false });
    }
    this.suggestedName = formula;
    this.refreshPreview();
  }

  swapOperands(): void {
    const { leftColumn, rightColumn } = this.form.getRawValue();
    this.form.patchValue({ leftColumn: rightColumn, rightColumn: leftColumn }, { emitEvent: false });
    this.onSelectionChanged();
  }

  nameErrorMessage(): string {
    return columnNameErrorMessage(this.form.controls.name);
  }

  async save(): Promise<void> {
    const name = this.form.controls.name.value.trim();
    const computation = this.computation();
    const width = Math.max(this.widthOf(computation.leftColumn), this.widthOf(computation.rightColumn), name.length);
    const column: Column = { name, dataType: DataType.NUMBER, width, indexed: false, computation };
    this.saving = true;
    this.errorMessage = undefined;
    try {
      await this.computedColumnService.save(column, this.data.column?.name);
      this.data.savedColumn = column;
      this.dialogRef.close();
    } catch (err) {
      this.errorMessage = LanguageService.instant('computedColumn.notSaved', { error: this.errorTextOf(err) });
    } finally {
      this.saving = false;
    }
  }

  async delete(): Promise<void> {
    const name = this.data.column.name;
    const confirmed = await confirmYesNo(this.dialogService, LanguageService.instant('computedColumn.deleteTitle'),
      LanguageService.instant('computedColumn.deleteQuestion', { name: _.escape(name) }));
    if (confirmed) {
      this.errorMessage = undefined;
      try {
        await this.computedColumnService.remove(name);
        this.dialogRef.close();
      } catch (err) {
        this.errorMessage = LanguageService.instant('computedColumn.notDeleted', { error: this.errorTextOf(err) });
      }
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }

  private refreshPreview(): void {
    const computation = this.computation();
    this.formula = LanguageService.instant('computedColumn.formulaLabel', { formula: formulaOf(computation) });
    const index = this.data.entries.findIndex(e => computeValue(computation, e) !== undefined);
    if (index < 0) {
      this.example = LanguageService.instant('computedColumn.noExample');
    } else {
      const entry = this.data.entries[index];
      const formula = formulaOf({
        ...computation,
        leftColumn: this.numberFormatter.format(entry[computation.leftColumn]),
        rightColumn: this.numberFormatter.format(entry[computation.rightColumn])
      });
      const result = this.numberFormatter.format(computeValue(computation, entry));
      this.example = LanguageService.instant('computedColumn.example', { row: index + 1, formula, result });
    }
  }

  private computation(): Computation {
    const { leftColumn, operator, rightColumn } = this.form.getRawValue();
    return { leftColumn, operator, rightColumn };
  }

  private widthOf(columnName: string): number {
    return this.operands.find(c => c.name === columnName).width;
  }

  private errorTextOf(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
  }
}
