import { Component, ViewEncapsulation, Input, Output, EventEmitter } from '@angular/core';
import { NumberRangeFilter } from './model/number-range-filter';
import { ChangeContext } from 'app/ngx-slider/change-context';

@Component({
  selector: 'koia-range-filter',
  templateUrl: './range-filter.component.html',
  styleUrls: ['./range-filter.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class RangeFilterComponent {

  @Input() filter: NumberRangeFilter;
  @Output() onChange: EventEmitter<void> = new EventEmitter();
  @Output() onRemove: EventEmitter<void> = new EventEmitter();

  onChanged(changeContext: ChangeContext): void {
    this.filter.selValueRange.min = changeContext.value;
    this.filter.selValueRange.max = changeContext.highValue;
    this.onChange.emit();
  }

  onInvertedChanged(inverted: boolean): void {
    this.filter.inverted = inverted;
    this.onChange.emit();
  }

  reset(): void {
    this.filter.reset();
    setTimeout(() => this.onChange.emit(), 500); // let slider properly reset itself
  }
}
