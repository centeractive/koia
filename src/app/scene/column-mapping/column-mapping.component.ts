import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ColumnPair, DataType } from 'app/shared/model';
import { ColumnDefinitionAssistant } from '../utils';
import { DateTimeUtils } from 'app/shared/utils';
import { DatePipe } from '@angular/common';
import { FormControl, Validators } from '@angular/forms';
import { ColumnMappingGenerator } from './mapper';

@Component({
  selector: 'koia-column-mapping',
  templateUrl: './column-mapping.component.html',
  styleUrls: ['./column-mapping.component.css']
})
export class ColumnMappingComponent implements OnInit {

  @Input() mapping: ColumnPair;
  @Output() onChange: EventEmitter<void> = new EventEmitter();
  @Output() onRemove: EventEmitter<void> = new EventEmitter();

  readonly columnDefAssistant = new ColumnDefinitionAssistant();
  readonly now = new Date();
  readonly datePipe = new DatePipe('en-US');
  dateFormats: string[];
  columnNameControl: FormControl;

  ngOnInit() {
    this.dateFormats = DateTimeUtils.allTimeUnits('desc')
      .map(timeunit => DateTimeUtils.ngFormatOf(timeunit));
    this.columnNameControl = new FormControl('', [
      Validators.required,
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
      return 'Name is required';
    } else if (this.columnNameControl.hasError('maxlength')) {
      return 'Name must not exceed ' + ColumnMappingGenerator.COLUMN_NAME_MAX_LENGTH + ' characters';
    } else {
      return '';
    }
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
