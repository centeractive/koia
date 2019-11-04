import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { PropertyFilter, Column, DataType, Operator } from 'app/shared/model';
import { NumberUtils } from 'app/shared/utils';
import { DBService } from 'app/shared/services/backend';
import { ValueFilterCustomizer } from './value-filter-customizer';

@Component({
  selector: 'koia-value-filter',
  templateUrl: './value-filter.component.html',
  styleUrls: ['./value-filter.component.css']
})
export class ValueFilterComponent implements OnInit {

  @Input() filter: PropertyFilter;
  @Output() onChange: EventEmitter<void> = new EventEmitter();
  @Output() onRemove: EventEmitter<void> = new EventEmitter();

  readonly operators: Operator[];
  valueFilterCustomizer = new ValueFilterCustomizer();
  columns: Column[];

  constructor(private dbService: DBService) {
    this.operators = Object.keys(Operator).map(key => Operator[key]);
  }

  ngOnInit() {
    this.columns = this.dbService.getActiveScene().columns;
  }

  availableOperators(): Operator[] {
    const column = this.columns.find(c => c.name === this.filter.name);
    if (column.dataType === DataType.TEXT) {
      return this.operators;
    } else if (column.dataType === DataType.TIME) {
      return [Operator.EMPTY, Operator.NOT_EMPTY];
    } else {
      return this.operators.filter(o => o !== Operator.CONTAINS);
    }
  }

  onNameChanged(column: Column): void {
    this.filter.name = column.name;
    this.filter.dataType = column.dataType;
    if (!this.availableOperators().includes(this.filter.operator)) {
      this.filter.operator = column.dataType === DataType.TIME ? Operator.NOT_EMPTY : Operator.EQUAL;
    }
    if (this.filter.isApplicable()) {
      this.onChange.emit();
    }
  }

  onValueChanged(value: string): void {
    if (this.filter.dataType === DataType.NUMBER) {
      const num = NumberUtils.parseNumber(value);
      this.filter.value = num === undefined ? value : num;
    } else {
      this.filter.value = value;
    }
  }

  onKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onChange.emit();
    }
  }

  reset() {
    this.filter.clearFilterValue();
    this.onChange.emit();
  }
}
