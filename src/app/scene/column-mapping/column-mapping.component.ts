import { LanguageService } from 'app/shared/services/language';
import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { ColumnPair, DataType, EnumLabels } from 'app/shared/model';
import { DateTimeUtils } from 'app/shared/utils';
import { ColumnDefinitionAssistant } from '../utils';
import { ColumnMappingGenerator } from './mapper';

@Component({
    selector: 'koia-column-mapping',
    templateUrl: './column-mapping.component.html',
    styleUrls: ['./column-mapping.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ColumnMappingComponent implements OnInit {

  readonly dataTypeLabel = EnumLabels.dataType;

  @Input() mapping: ColumnPair;
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
    this.columnNameControl = new UntypedFormControl('', [
      Validators.required,
      Validators.pattern(ColumnMappingGenerator.COLUMN_NAME_PATTERN),
      Validators.maxLength(ColumnMappingGenerator.COLUMN_NAME_MAX_LENGTH)
    ]);
    this.columnNameControl.setValue(this.mapping.target.name);
    this.columnNameControl.markAsTouched();
  }

  onColumnNameChanged(name: string): void {
    this.mapping.target.name = name;
    this.onChange.emit();
  }

  getColumnNameErrorMessage(): string {
    if (this.columnNameControl.hasError('required')) {
      return LanguageService.instant('scene.column.nameRequired');
    } else if (this.columnNameControl.hasError('pattern')) {
      return LanguageService.instant('scene.column.nameDollar');
    } else if (this.columnNameControl.hasError('maxlength')) {
      return LanguageService.instant('scene.column.nameTooLong', { max: ColumnMappingGenerator.COLUMN_NAME_MAX_LENGTH });
    } else {
      return '';
    }
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
    window.open('https://angular.io/api/common/DatePipe#custom-format-options');
  }
}
