import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { ChangeContext } from 'app/ngx-slider/change-context';
import { DataType } from 'app/shared/model';
import { ValueRange } from 'app/shared/value-range/model';
import { Subscription } from 'rxjs';
import { NumberRangeFilter } from './model/number-range-filter';

@Component({
    selector: 'koia-range-filter',
    templateUrl: './range-filter.component.html',
    styleUrls: ['./range-filter.component.css'],
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
export class RangeFilterComponent implements OnChanges, OnDestroy {

  @Input() filter: NumberRangeFilter;
  @Output() onChange = new EventEmitter<void>();
  @Output() onRemove = new EventEmitter<void>();

  valueRange: ValueRange;
  refreshSlider = new EventEmitter<void>();

  private subscription: Subscription;

  ngOnChanges(changes: SimpleChanges): void {
    this.unsubscribeSubscription();
    this.filter.onAdjustedValueRange().subscribe(() => this.onChange.emit());
    this.valueRange = this.filter.sliderValueRange;
  }

  onChanged(changeContext: ChangeContext): void {
    this.valueRange.min = changeContext.value;
    this.valueRange.max = changeContext.highValue;
    this.onChange.emit();
  }

  onInvertedChanged(inverted: boolean): void {
    this.filter.inverted = inverted;
    this.onChange.emit();
  }

  onHighValueChanged(): void {
    if (this.filter.column.dataType !== DataType.TIME) {
      this.valueRange.maxExcluding = false;
    }
  }

  reset(): void {
    this.filter.reset();
    this.onChange.emit();
    this.refreshSlider.emit();
  }

  ngOnDestroy(): void {
    this.unsubscribeSubscription();
  }

  private unsubscribeSubscription(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
