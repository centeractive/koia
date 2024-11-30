import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Column, DataType, Operator, PropertyFilter } from 'app/shared/model';
import { DBService } from 'app/shared/services/backend';
import { PropertyFilterValidator } from 'app/shared/validator';
import { FilterValueParser } from './filter-value-parser';
import { ValueFilterCustomizer } from './value-filter-customizer';
import { ValueFilterUtils } from './value-filter-utils';

@Component({
    selector: 'koia-value-filter',
    templateUrl: './value-filter.component.html',
    styleUrls: ['./value-filter.component.css'],
    standalone: false
})
export class ValueFilterComponent implements OnInit {

  @Input() filter: PropertyFilter;
  @Output() onChange = new EventEmitter<void>();
  @Output() onRemove = new EventEmitter<void>();

  readonly operators: Operator[];
  valueFilterCustomizer = new ValueFilterCustomizer();
  columns: Column[];
  valueControl = new FormControl();
  numberDataType: boolean;

  private validator: PropertyFilterValidator;
  private valueParser: FilterValueParser;

  constructor(private dbService: DBService) {
    this.operators = Object.keys(Operator).map(key => Operator[key]);
  }

  ngOnInit() {
    this.columns = this.dbService.getActiveScene().columns;
    this.validator = new PropertyFilterValidator(this.columns);
    this.valueParser = new FilterValueParser(this.filter);
    this.valueControl.setValue(this.valueFilterCustomizer.formattedValueOf(this.filter));
    this.numberDataType = this.filter.dataType === DataType.NUMBER;
  }

  availableOperators(): Operator[] {
    const dataType = this.columns.find(c => c.name === this.filter.name).dataType;
    if (dataType === DataType.TEXT) {
      return this.operators;
    } else if (dataType === DataType.TIME) {
      return [Operator.EMPTY, Operator.NOT_EMPTY];
    } else if (dataType === DataType.BOOLEAN) {
      return [Operator.EQUAL, Operator.EMPTY, Operator.NOT_EMPTY];
    } else if (dataType === DataType.OBJECT) {
      return [Operator.CONTAINS, Operator.EMPTY, Operator.NOT_EMPTY];
    } else {
      return this.operators.filter(o => o !== Operator.CONTAINS);
    }
  }

  isEqualBoolean(): boolean {
    return this.filter.operator === Operator.EQUAL && this.filter.dataType === DataType.BOOLEAN;
  }

  onNameChanged(column: Column): void {
    this.filter.name = column.name;
    this.filter.dataType = column.dataType;
    if (!this.availableOperators().includes(this.filter.operator)) {
      this.filter.operator = ValueFilterUtils.defaultOperatorOf(column.dataType);
    }
    if (this.filter.operator === Operator.EQUAL && column.dataType === DataType.BOOLEAN &&
      this.filter.value !== true && this.filter.value !== false) {
      this.filter.value = true;
    }
    if (this.filter.isApplicable()) {
      this.onChange.emit();
    }
    this.validate();
  }

  onValueChanged(value: string): void {
    this.filter.value = this.valueParser.parse(value);
    this.validate();
  }

  private validate(): void {
    const error = this.validator.validate(this.filter);
    this.valueControl.setErrors(error ? { error: error } : null);
    this.valueControl.markAsTouched();
  }
}
