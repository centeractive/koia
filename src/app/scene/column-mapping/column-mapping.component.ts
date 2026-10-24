import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { ColumnPair, DataType, EnumLabels } from 'app/shared/model';
import { DateTimeUtils } from 'app/shared/utils';
import { columnNameErrorMessage, columnNameValidators, storedColumnNameValidator } from 'app/shared/validator/column-name-validation';
import { ColumnDefinitionAssistant } from '../utils';
import { ColumnMappingGenerator } from './mapper';

@Component({
    selector: 'koia-column-mapping',
    templateUrl: './column-mapping.component.html',
    styleUrls: ['./column-mapping.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ColumnMappingComponent implements OnInit, OnChanges {

  readonly dataTypeLabel = EnumLabels.dataType;

  @Input() mapping: ColumnPair;
  @Input() nameInUse = false;
  @Output() onChange = new EventEmitter<void>();
  @Output() onRemove = new EventEmitter<void>();

  readonly columnDefAssistant = new ColumnDefinitionAssistant();
  readonly now = new Date();
  readonly datePipe = new DatePipe('en-US');
  dateFormats: string[];
  columnNameControl: UntypedFormControl;

  ngOnInit() {
    this.dateFormats = DateTimeUtils.allTimeUnits('desc')
      .map(timeunit => DateTimeUtils.ngFormatOf(timeunit));
    this.columnNameControl = new UntypedFormControl('', [...columnNameValidators(), storedColumnNameValidator,
      () => this.nameInUse ? { nameInUse: true } : null]);
    this.columnNameControl.setValue(this.mapping.target.name);
    this.columnNameControl.markAsTouched();
  }

  ngOnChanges(): void {
    this.columnNameControl?.updateValueAndValidity();
  }

  onColumnNameChanged(name: string): void {
    this.mapping.target.name = name;
    this.onChange.emit();
  }

  getColumnNameErrorMessage(): string {
    return columnNameErrorMessage(this.columnNameControl);
  }

  /**
   * @returns the translation key of the known warning, the warning itself otherwise (the warning is persisted with the scene
   * and therefore stays English)
   */
  warningOf(mapping: ColumnPair): string {
    return mapping.warning === ColumnMappingGenerator.INCOMPATIBLE_DATA_TYPES ? 'scene.column.incompatibleTypes' : mapping.warning;
  }

  formattedNow(format: string): string {
    return this.datePipe.transform(this.now, format);
  }

  onDataTypeChanged(): void {
    const targetColumn = this.mapping.target;
    if (targetColumn.dataType === DataType.TIME && !targetColumn.format) {
      targetColumn.format = this.dateFormats[0];
    }
    this.onChange.emit();
  }

  openDatePipeFormatPage() {
    window.open('https://angular.io/api/common/DatePipe#custom-format-options', '_blank', 'noopener');
  }
}
